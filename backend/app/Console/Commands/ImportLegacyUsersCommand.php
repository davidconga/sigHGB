<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportLegacyUsersCommand extends Command
{
    protected $signature = 'legacy:import-users
                            {file : Caminho absoluto do .sql dump}
                            {--dry-run}';

    protected $description = 'Importa utilizadores do sistema antigo (preserva passwords bcrypt)';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("Ficheiro não encontrado: {$path}");
            return self::FAILURE;
        }

        $dry = $this->option('dry-run');
        $this->info("A ler {$path}");
        if ($dry) $this->warn("MODO DRY-RUN — nada será gravado.");

        $handle = fopen($path, 'r');
        $count = 0; $created = 0; $skipped = 0; $existed = 0;

        DB::beginTransaction();
        try {
            while (($line = fgets($handle)) !== false) {
                if (! str_starts_with($line, '(')) continue;
                $line = rtrim($line, ",;\r\n ");

                $row = $this->parseValues($line);
                if (! $row || count($row) < 9) { $skipped++; continue; }

                $count++;
                if ($dry) continue;

                // 0=id, 1=name, 2=email, 3=email_verified_at,
                // 4=password, 5=remember_token, 6=created_at, 7=updated_at, 8=isAdmin

                $name = $this->cleanStr($row[1]);
                $email = $this->cleanStr($row[2]);
                $password = $this->cleanStr($row[4]);
                $isAdmin = trim($row[8]) === '1';

                if (! $email || ! $password) { $skipped++; continue; }

                if (User::where('email', $email)->exists()) {
                    $existed++;
                    continue;
                }

                $user = User::create([
                    'name' => $name ?: $email,
                    'email' => $email,
                    'password' => $password, // já está em bcrypt
                    'ativo' => true,
                ]);

                // Bypass o cast 'hashed' do password — gravar o bcrypt importado tal qual
                User::where('id', $user->id)->update(['password' => $password]);

                $user->assignRole($isAdmin ? 'admin' : 'medico');
                $created++;
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
                    ['Utilizadores criados', $created],
                    ['Já existiam (ignorados)', $existed],
                    ['Linhas saltadas', $skipped],
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
}
