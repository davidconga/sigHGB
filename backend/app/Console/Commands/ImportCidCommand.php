<?php

namespace App\Console\Commands;

use App\Models\Cid;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportCidCommand extends Command
{
    protected $signature = 'cid:import
                            {--truncate : Apaga a tabela antes de importar}';

    protected $description = 'Importa códigos CID-10 (categorias e subcategorias) a partir dos CSV em database/data';

    private const CAPITULOS = [
        ['A', 'B', 'I — Doenças infecciosas e parasitárias'],
        ['C', 'D', 'II — Neoplasias / Doenças do sangue'],
        ['E', 'E', 'IV — Doenças endócrinas, nutricionais e metabólicas'],
        ['F', 'F', 'V — Transtornos mentais e comportamentais'],
        ['G', 'G', 'VI — Doenças do sistema nervoso'],
        ['H', 'H', 'VII/VIII — Doenças do olho e do ouvido'],
        ['I', 'I', 'IX — Doenças do aparelho circulatório'],
        ['J', 'J', 'X — Doenças do aparelho respiratório'],
        ['K', 'K', 'XI — Doenças do aparelho digestivo'],
        ['L', 'L', 'XII — Doenças da pele e tecido subcutâneo'],
        ['M', 'M', 'XIII — Doenças do sistema osteomuscular'],
        ['N', 'N', 'XIV — Doenças do aparelho geniturinário'],
        ['O', 'O', 'XV — Gravidez, parto e puerpério'],
        ['P', 'P', 'XVI — Afecções originadas no período perinatal'],
        ['Q', 'Q', 'XVII — Malformações congénitas'],
        ['R', 'R', 'XVIII — Sintomas, sinais e achados anormais'],
        ['S', 'T', 'XIX — Lesões, envenenamentos e causas externas'],
        ['V', 'Y', 'XX — Causas externas de morbilidade e mortalidade'],
        ['Z', 'Z', 'XXI — Fatores que influenciam o estado de saúde'],
        ['U', 'U', 'XXII — Códigos para propósitos especiais'],
    ];

    public function handle(): int
    {
        if ($this->option('truncate')) {
            if ($this->confirm('Apagar todos os registos da tabela cids?', true)) {
                Cid::truncate();
                $this->warn('Tabela cids esvaziada.');
            }
        }

        $base = database_path('data');
        $files = [
            ['path' => $base.'/cid-categorias.csv', 'isSubcat' => false, 'label' => 'categorias'],
            ['path' => $base.'/cid-subcategorias.csv', 'isSubcat' => true, 'label' => 'subcategorias'],
        ];

        $totalInserted = 0;

        foreach ($files as $f) {
            if (! file_exists($f['path'])) {
                $this->error("Ficheiro em falta: {$f['path']}");
                continue;
            }

            $this->info("A importar {$f['label']} de {$f['path']}");

            $handle = fopen($f['path'], 'r');
            fgets($handle); // skip header

            $batch = [];
            $count = 0;
            $now = now();
            $descColIndex = $f['isSubcat'] ? 4 : 2;

            while (($line = fgets($handle)) !== false) {
                $line = rtrim($line, "\r\n");
                if ($line === '') continue;

                $row = explode(';', $line);
                if (! isset($row[0]) || $row[0] === '') continue;

                $raw = $row[0];
                $descricao = mb_convert_encoding($row[$descColIndex] ?? '', 'UTF-8', 'ISO-8859-1');
                if ($descricao === '') continue;

                $codigo = ($f['isSubcat'] && strlen($raw) > 3)
                    ? substr($raw, 0, 3).'.'.substr($raw, 3)
                    : $raw;

                $batch[] = [
                    'codigo' => $codigo,
                    'descricao' => $descricao,
                    'capitulo' => $this->capituloPara($codigo),
                    'ativo' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($batch) >= 500) {
                    DB::table('cids')->insertOrIgnore($batch);
                    $count += count($batch);
                    $batch = [];
                    $this->output->write('.');
                }
            }

            if (! empty($batch)) {
                DB::table('cids')->insertOrIgnore($batch);
                $count += count($batch);
            }

            fclose($handle);
            $this->newLine();
            $this->info("→ {$count} {$f['label']} processadas.");
            $totalInserted += $count;
        }

        $this->newLine();
        $this->info("Total na tabela: ".Cid::count()." registos.");

        $this->importEnglish();

        return self::SUCCESS;
    }

    private function importEnglish(): void
    {
        $path = database_path('data/cid-en-categories.csv');
        if (! file_exists($path)) {
            $this->warn("Ficheiro EN não encontrado: {$path}");
            return;
        }

        $this->info("A importar descrições em inglês de {$path}");
        $handle = fopen($path, 'r');
        $updated = 0; $checked = 0;

        while (($line = fgets($handle)) !== false) {
            $line = rtrim($line, "\r\n");
            if ($line === '') continue;

            if (! preg_match('/^([A-Z0-9]+),"(.+)"$/', $line, $m)) continue;
            $rawCode = $m[1];
            $descEn = $m[2];

            $codigo = strlen($rawCode) > 3
                ? substr($rawCode, 0, 3).'.'.substr($rawCode, 3)
                : $rawCode;

            $checked++;
            $affected = DB::table('cids')
                ->where('codigo', $codigo)
                ->update(['descricao_en' => $descEn, 'updated_at' => now()]);
            if ($affected) $updated++;
        }
        fclose($handle);

        $this->info("→ {$updated} de {$checked} descrições EN aplicadas.");
    }

    private function capituloPara(string $codigo): ?string
    {
        $letra = strtoupper(substr($codigo, 0, 1));
        foreach (self::CAPITULOS as [$de, $ate, $nome]) {
            if ($letra >= $de && $letra <= $ate) return $nome;
        }
        return null;
    }
}
