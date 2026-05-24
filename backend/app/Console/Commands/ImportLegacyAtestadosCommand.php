<?php

namespace App\Console\Commands;

use App\Models\Atestado;
use App\Models\Paciente;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLegacyAtestadosCommand extends Command
{
    protected $signature = 'legacy:import-atestados
                            {file : Caminho absoluto do .sql dump}
                            {--dry-run : Apenas conta registos sem importar}
                            {--limit=0 : Limita número de registos a importar}';

    protected $description = 'Importa atestados do sistema antigo (phpMyAdmin dump MySQL)';

    private const TIPO_MAP = [
        1 => 'aptidao',
        2 => 'aptidao',
        3 => 'comparecimento',
        4 => 'outros',
        5 => 'outros',
        6 => 'outros',
    ];

    private const EFEITO_MAP = [
        1 => 'Matrícula',
        2 => 'Trabalho',
        3 => 'Desporto',
        4 => 'Inscrição',
    ];

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("Ficheiro não encontrado: {$path}");
            return self::FAILURE;
        }

        // Silence observers — see ImportLegacyRelatoriosCommand for the why.
        Atestado::unsetEventDispatcher();

        $dry = $this->option('dry-run');
        $limit = (int) $this->option('limit');

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
                if (! $row || count($row) < 20) { $skipped++; continue; }

                $count++;
                if ($limit && $count > $limit) break;

                if ($dry) continue;

                [$id, $name, $dateNasc, $municipioId, $natural, $pai, $mae,
                 $motivoEfeito, $classe, $bi, $docEmi, $docExp, $docEmissor,
                 $date, $code, $sexe, $createdAt, $updatedAt, $docTypeId, $userId] = $row;

                $bi = $this->cleanStr($bi);
                $name = $this->cleanStr($name);
                if (! $name) { $skipped++; continue; }

                $pacKey = $bi ?: "name:".mb_strtoupper($name);
                $paciente = $bi ? Paciente::where('bi', $bi)->first()
                    : Paciente::whereRaw('UPPER(nome)=?', [mb_strtoupper($name)])->first();

                if ($paciente) {
                    $reusedPac++;
                } else {
                    $paciente = Paciente::create([
                        'nome' => $name,
                        'nome_pai' => $this->cleanStr($pai),
                        'nome_mae' => $this->cleanStr($mae),
                        'bi' => $bi,
                        'bi_emissao_local' => $this->cleanStr($docEmissor),
                        'bi_emissao_data' => $this->parseDate($docEmi),
                        'data_nascimento' => $this->parseDate($dateNasc),
                        'sexo' => $this->cleanStr($sexe) === 'F' ? 'F' : ($this->cleanStr($sexe) === 'M' ? 'M' : null),
                        'municipio' => 'Benguela',
                        'provincia' => 'Benguela',
                        'naturalidade_municipio' => $this->cleanStr($natural),
                        'naturalidade_provincia' => 'Benguela',
                    ]);
                }

                $tipo = self::TIPO_MAP[(int) $docTypeId] ?? 'outros';
                $efeitoNum = (int) trim($motivoEfeito, "' ");
                $destino = self::EFEITO_MAP[$efeitoNum] ?? null;

                Atestado::create([
                    'paciente_id' => $paciente->id,
                    'medico_id' => null, // legado não tinha campo médico — fica por atribuir
                    'tipo' => $tipo,
                    'data_emissao' => $this->parseDate($date) ?: now()->toDateString(),
                    'diagnostico' => null,
                    'motivo' => $this->cleanStr($classe),
                    'destino' => $destino,
                    'status' => 'emitido',
                ]);

                $created++;

                if ($created % 500 === 0) {
                    $this->output->write('.');
                }
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
                    ['Atestados criados', $created],
                    ['Pacientes reutilizados', $reusedPac],
                    ['Linhas saltadas (inválidas)', $skipped],
                ]);
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Erro: ".$e->getMessage());
            return self::FAILURE;
        } finally {
            fclose($handle);
        }

        return self::SUCCESS;
    }

    private function parseValues(string $line): ?array
    {
        // remove paren externos
        if (! str_starts_with($line, '(') || ! str_ends_with($line, ')')) return null;
        $inner = substr($line, 1, -1);

        $values = [];
        $current = '';
        $inString = false;
        $i = 0;
        $len = strlen($inner);

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
        $v = trim((string) $v, "' ");
        if ($v === '' || strtoupper($v) === 'NULL') return null;
        return str_replace(["\\'", '\\"', '\\\\'], ["'", '"', '\\'], $v);
    }

    private function parseDate($v): ?string
    {
        $s = $this->cleanStr($v);
        if (! $s) return null;
        try {
            return \Carbon\Carbon::parse($s)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
