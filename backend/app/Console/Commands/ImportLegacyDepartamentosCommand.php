<?php

namespace App\Console\Commands;

use App\Models\Departamento;
use App\Models\Servico;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLegacyDepartamentosCommand extends Command
{
    protected $signature = 'legacy:import-departamentos {file}';
    protected $description = 'Importa departamentos e serviços do dump SQL antigo';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("Ficheiro não encontrado: {$path}");
            return self::FAILURE;
        }

        $sql = file_get_contents($path);
        $depMap = []; // legacy_id => new_id

        DB::beginTransaction();
        try {
            // Departamentos
            if (preg_match('/INSERT INTO `departamentos`.*?VALUES\s*(.*?);\s*$/sm', $sql, $m)) {
                $rows = $this->parseRows($m[1]);
                foreach ($rows as $r) {
                    if (count($r) < 2) continue;
                    $legacyId = (int) $r[0];
                    $nome = $this->cleanStr($r[1]);
                    if (! $nome) continue;
                    $d = Departamento::firstOrCreate(['nome' => $nome]);
                    $depMap[$legacyId] = $d->id;
                }
                $this->info('Departamentos: '.count($depMap));
            }

            // Serviços
            if (preg_match('/INSERT INTO `servicos`.*?VALUES\s*(.*?);\s*$/sm', $sql, $m)) {
                $rows = $this->parseRows($m[1]);
                $count = 0;
                foreach ($rows as $r) {
                    if (count($r) < 3) continue;
                    $nome = $this->cleanStr($r[1]);
                    $legacyDepId = (int) $r[2];
                    if (! $nome || ! isset($depMap[$legacyDepId])) continue;
                    Servico::firstOrCreate([
                        'departamento_id' => $depMap[$legacyDepId],
                        'nome' => $nome,
                    ]);
                    $count++;
                }
                $this->info("Serviços: {$count}");
            }

            DB::commit();
            $this->newLine();
            $this->table(['Métrica', 'Valor'], [
                ['Departamentos', Departamento::count()],
                ['Serviços', Servico::count()],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        return self::SUCCESS;
    }

    private function parseRows(string $valuesBlock): array
    {
        $rows = [];
        $lines = preg_split('/\),\s*\n?\(/', trim($valuesBlock, " \n\t("));
        foreach ($lines as $line) {
            $line = rtrim($line, ')');
            $rows[] = $this->parseValues('('.$line.')');
        }
        return $rows;
    }

    private function parseValues(string $line): array
    {
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
}
