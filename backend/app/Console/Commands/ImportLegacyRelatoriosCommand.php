<?php

namespace App\Console\Commands;

use App\Models\Paciente;
use App\Models\Relatorio;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLegacyRelatoriosCommand extends Command
{
    protected $signature = 'legacy:import-relatorios
                            {file : Caminho absoluto do .sql dump}
                            {--dry-run}
                            {--limit=0}
                            {--default-medico=1 : ID do médico a usar quando legado não tem mapeamento}';

    protected $description = 'Importa relatórios médicos do sistema antigo (phpMyAdmin dump)';

    private const TIPO_MAP = [
        1 => 'relatorio_medico',
        2 => 'junta_medica',
        3 => 'fisioterapeutico',
        4 => 'informacao_clinica',
        5 => 'nota_alta',
        6 => 'guia_transferencia',
    ];

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("Ficheiro não encontrado: {$path}");
            return self::FAILURE;
        }

        $dry = $this->option('dry-run');
        $limit = (int) $this->option('limit');
        $defaultMedico = (int) $this->option('default-medico');

        $this->info("A ler {$path}");
        if ($dry) $this->warn("MODO DRY-RUN — nada será gravado.");

        $handle = fopen($path, 'r');
        $count = 0; $created = 0; $skipped = 0; $reusedPac = 0;

        DB::beginTransaction();
        try {
            while (($line = fgets($handle)) !== false) {
                if (! str_starts_with($line, '(')) continue;
                $line = rtrim($line, ",;\r\n ");

                $row = $this->parseValues($line);
                if (! $row || count($row) < 30) { $skipped++; continue; }

                $count++;
                if ($limit && $count > $limit) break;

                if ($dry) continue;

                // Schema do legado (índices 0-based):
                // 0=id, 1=num, 2=name, 3=date_nasc, 4=sexe, 5=estado_civil,
                // 6=municipio_id, 7=recidencia, 8=historia, 9=objectivo,
                // 10=exame_fisico, 11=exame_solicitado, 12=exame_Exame_complementares,
                // 13=diagnostico, 14=tratamento, 15=conduta, 16=motivo_evacuacao,
                // 17=date, 18=medico, 19=medico_id, 20=created_at, 21=updated_at,
                // 22=resumo_clinico, 23=hipotese, 24=motivo_internamento,
                // 25=motivo_transfer, 26=Terapeutica, 27=tipo_doc_id,
                // 28=grau_discapacidade, 29=nacionalidade, 30=queixas, 31=user_id,
                // 32=destino, 33=naturalidade

                $name = $this->cleanStr($row[2] ?? null);
                if (! $name) { $skipped++; continue; }

                $sexe = $this->cleanStr($row[4]);
                $sexo = str_starts_with(strtoupper($sexe ?? ''), 'M') ? 'M'
                    : (str_starts_with(strtoupper($sexe ?? ''), 'F') ? 'F' : null);

                // Procura paciente por nome+data_nasc (não há BI no legado)
                $dataNasc = $this->parseDate($row[3]);
                $paciente = null;
                if ($dataNasc) {
                    $paciente = Paciente::whereRaw('UPPER(nome)=?', [mb_strtoupper($name)])
                        ->whereDate('data_nascimento', $dataNasc)
                        ->first();
                }
                if (! $paciente) {
                    $paciente = Paciente::create([
                        'nome' => $name,
                        'data_nascimento' => $dataNasc,
                        'sexo' => $sexo,
                        'estado_civil' => $this->cleanStr($row[5]),
                        'bairro' => $this->cleanStr($row[7]),
                        'municipio' => 'Benguela',
                        'provincia' => 'Benguela',
                        'naturalidade_municipio' => $this->cleanStr($row[33] ?? null),
                        'naturalidade_provincia' => 'Benguela',
                    ]);
                } else {
                    $reusedPac++;
                }

                $tipoDocId = (int) trim($this->cleanStr($row[27]) ?? '0', "' ");
                $tipo = self::TIPO_MAP[$tipoDocId] ?? 'relatorio_medico';

                $historia = $this->joinNonEmpty([
                    $this->cleanStr($row[8]),  // historia
                    $this->cleanStr($row[22]), // resumo_clinico
                    $this->cleanStr($row[30] ?? null), // queixas
                ]);

                $exameObj = $this->joinNonEmpty([
                    $this->cleanStr($row[9]),  // objectivo
                    $this->cleanStr($row[10]), // exame_fisico
                ]);

                $exameComp = $this->joinNonEmpty([
                    $this->cleanStr($row[11]), // exame_solicitado
                    $this->cleanStr($row[12]), // exame_Exame_complementares
                ]);

                $diagnostico = $this->cleanStr($row[13]) ?: $this->cleanStr($row[23]);

                $tratamento = $this->joinNonEmpty([
                    $this->cleanStr($row[14]), // tratamento
                    $this->cleanStr($row[26]), // Terapeutica
                ]);

                $motivo = $this->cleanStr($row[16])
                    ?: $this->cleanStr($row[24])
                    ?: $this->cleanStr($row[25]);

                $grauStr = $this->cleanStr($row[28]);
                $grau = null;
                if ($grauStr && preg_match('/(\d{1,3})/', $grauStr, $m)) {
                    $grau = min(100, max(0, (int) $m[1]));
                }

                $legacyMedicoId = (int) ($row[19] ?? 0);
                $medicoId = $legacyMedicoId > 0 && \App\Models\Medico::where('id', $legacyMedicoId)->exists()
                    ? $legacyMedicoId : null;

                Relatorio::create([
                    'paciente_id' => $paciente->id,
                    'medico_id' => $medicoId,
                    'tipo' => $tipo,
                    'data_emissao' => $this->parseDate($row[17]) ?: now()->toDateString(),
                    'historia_doenca' => $historia ?: '—',
                    'exame_objectivo' => $exameObj,
                    'exames_complementares' => $exameComp,
                    'diagnostico' => $diagnostico ?: '—',
                    'tratamento' => $tratamento,
                    'recomendacao' => $this->cleanStr($row[15]),
                    'motivo' => $motivo,
                    'grau_discapacidade' => $grau,
                    'status' => 'emitido',
                ]);

                $created++;
                if ($created % 200 === 0) $this->output->write('.');
            }

            if ($dry) {
                DB::rollBack();
                $this->info("\n[DRY-RUN] Linhas válidas: {$count} · Inválidas: {$skipped}");
            } else {
                DB::commit();
                $this->newLine();
                $this->info("Importação concluída.");
                $this->table(['Métrica', 'Valor'], [
                    ['Linhas processadas', $count],
                    ['Relatórios criados', $created],
                    ['Pacientes reutilizados', $reusedPac],
                    ['Linhas saltadas', $skipped],
                ]);
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Erro: ".$e->getMessage());
            $this->error($e->getTraceAsString());
            return self::FAILURE;
        } finally {
            fclose($handle);
        }

        return self::SUCCESS;
    }

    private function parseValues(string $line): ?array
    {
        if (! str_starts_with($line, '(') || ! str_ends_with($line, ')')) return null;
        $inner = substr($line, 1, -1);

        $values = [];
        $current = '';
        $inString = false;
        $i = 0; $len = strlen($inner);

        while ($i < $len) {
            $c = $inner[$i];
            if ($inString) {
                if ($c === '\\' && $i + 1 < $len) { $current .= $c.$inner[$i+1]; $i += 2; continue; }
                if ($c === "'") { $inString = false; $current .= $c; $i++; continue; }
                $current .= $c; $i++;
            } else {
                if ($c === "'") { $inString = true; $current .= $c; $i++; continue; }
                if ($c === ',') { $values[] = trim($current); $current = ''; $i++; continue; }
                $current .= $c; $i++;
            }
        }
        if ($current !== '') $values[] = trim($current);

        return $values;
    }

    private function cleanStr($v): ?string
    {
        if ($v === null) return null;
        $v = trim((string) $v, "' ");
        if ($v === '' || strtoupper($v) === 'NULL') return null;
        return str_replace(["\\'", '\\"', '\\\\', '\\n', '\\r'], ["'", '"', '\\', "\n", "\r"], $v);
    }

    private function parseDate($v): ?string
    {
        $s = $this->cleanStr($v);
        if (! $s) return null;
        try { return \Carbon\Carbon::parse($s)->toDateString(); } catch (\Throwable) { return null; }
    }

    private function joinNonEmpty(array $parts): ?string
    {
        $parts = array_filter(array_map(fn ($p) => trim((string) $p), $parts), fn ($p) => $p !== '');
        return empty($parts) ? null : implode("\n\n", $parts);
    }
}
