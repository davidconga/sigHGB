<?php

namespace App\Console\Commands;

use App\Models\Funcionario;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLegacyContactsCommand extends Command
{
    protected $signature = 'legacy:import-contacts {file}';
    protected $description = 'Importa contactos/funcionários do dump SQL antigo';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("Ficheiro não encontrado: {$path}");
            return self::FAILURE;
        }

        $handle = fopen($path, 'r');
        $count = 0; $created = 0; $skipped = 0;

        DB::beginTransaction();
        try {
            while (($line = fgets($handle)) !== false) {
                if (! str_starts_with($line, '(')) continue;
                $line = rtrim($line, ",;\r\n ");

                $row = $this->parseValues($line);
                if (! $row || count($row) < 13) { $skipped++; continue; }

                $count++;

                // 0=id, 1=name, 2=telefone, 3=sexe, 4=email, 5=status,
                // 6=created_at, 7=updated_at, 8=servico_id, 9=categoria_id,
                // 10=chefe_departamento, 11=chefe_service, 12=data_nasc

                $nome = $this->cleanStr($row[1]);
                $telefone = $this->cleanStr($row[2]);
                if (! $nome || ! $telefone) { $skipped++; continue; }

                $sexeStr = strtoupper($this->cleanStr($row[3]) ?? '');
                $sexo = str_starts_with($sexeStr, 'M') ? 'M'
                    : (str_starts_with($sexeStr, 'F') ? 'F' : null);

                Funcionario::create([
                    'nome' => $nome,
                    'telefone' => $telefone,
                    'sexo' => $sexo,
                    'email' => $this->cleanStr($row[4]),
                    'data_nascimento' => $this->parseDate($row[12]),
                    'servico' => $this->cleanStr($row[8]),
                    'categoria' => $this->cleanStr($row[9]),
                    'chefe_departamento' => $this->truthy($row[10]),
                    'chefe_servico' => $this->truthy($row[11]),
                    'ativo' => (int) trim($row[5]) === 1,
                    'receber_aniversario' => true,
                ]);
                $created++;
            }

            DB::commit();
            $this->newLine();
            $this->info("Importação concluída.");
            $this->table(['Métrica', 'Valor'], [
                ['Linhas processadas', $count],
                ['Funcionários criados', $created],
                ['Linhas saltadas', $skipped],
            ]);
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
        if (! str_starts_with($line, '(') || ! str_ends_with($line, ')')) return null;
        $inner = substr($line, 1, -1);
        $values = []; $current = ''; $inString = false; $i = 0; $len = strlen($inner);
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
        return str_replace(["\\'", '\\"', '\\\\'], ["'", '"', '\\'], $v);
    }

    private function parseDate($v): ?string
    {
        $s = $this->cleanStr($v);
        if (! $s) return null;
        try { return \Carbon\Carbon::parse($s)->toDateString(); } catch (\Throwable) { return null; }
    }

    private function truthy($v): bool
    {
        $s = trim((string) $v, "' ");
        return in_array(strtolower($s), ['1', 'true', 'sim', 'yes', 'y', 's'], true);
    }
}
