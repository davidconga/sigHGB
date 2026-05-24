<?php

namespace Database\Seeders;

use App\Models\Atestado;
use App\Models\Consulta;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CidSeeder::class,
            SettingSeeder::class,
            RolePermissionSeeder::class,
            AngolaSeeder::class,
        ]);


        $medico = Medico::create([
            'nome' => 'Dr. António Manuel',
            'numero_ordem' => 'OMA-1234',
            'especialidade' => 'Clínica Geral',
            'telefone' => '+244 923 000 001',
            'email' => 'antonio.manuel@hgb.ao',
        ]);

        Medico::create([
            'nome' => 'Dra. Maria João Tavares',
            'numero_ordem' => 'OMA-5678',
            'especialidade' => 'Pediatria',
            'telefone' => '+244 923 000 002',
            'email' => 'maria.tavares@hgb.ao',
        ]);

        User::create([
            'name' => 'Administrador HGB',
            'email' => 'admin@hgb.ao',
            'password' => Hash::make('admin123'),
        ])->assignRole('admin');

        User::create([
            'name' => 'Dr. António Manuel',
            'email' => 'antonio.manuel@hgb.ao',
            'password' => Hash::make('medico123'),
            'medico_id' => $medico->id,
        ])->assignRole('medico');

        User::create([
            'name' => 'Recepção',
            'email' => 'recepcao@hgb.ao',
            'password' => Hash::make('recepcao123'),
        ])->assignRole('recepcionista');

        $paciente = Paciente::create([
            'nome' => 'Beatriz Alfredo da Costa Chimuco',
            'nome_pai' => 'José Manuel da Costa Sobrinho',
            'nome_mae' => 'Natália Alfredo',
            'bi' => '005613264KS040',
            'bi_emissao_local' => 'Benguela',
            'bi_emissao_data' => '2024-05-20',
            'data_nascimento' => '1994-03-10',
            'sexo' => 'F',
            'telefone' => '+244 924 111 222',
            'municipio' => 'Benguela',
            'provincia' => 'Benguela',
            'naturalidade_provincia' => 'Cuanza Sul',
            'naturalidade_municipio' => 'Amboim',
            'grupo_sanguineo' => 'O+',
        ]);

        Paciente::create([
            'nome' => 'Ana Paula Chissingui',
            'nome_pai' => 'Manuel Chissingui',
            'nome_mae' => 'Helena Paulo',
            'bi' => '003344556LA042',
            'bi_emissao_local' => 'Luanda',
            'bi_emissao_data' => '2018-06-15',
            'data_nascimento' => '1992-09-21',
            'sexo' => 'F',
            'telefone' => '+244 924 333 444',
            'municipio' => 'Lobito',
            'provincia' => 'Benguela',
            'naturalidade_provincia' => 'Benguela',
            'naturalidade_municipio' => 'Lobito',
            'grupo_sanguineo' => 'A+',
        ]);

        Consulta::create([
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'data_consulta' => now()->subDays(2),
            'queixa_principal' => 'Cefaleia intensa há 3 dias.',
            'diagnostico' => 'Enxaqueca.',
            'cid' => 'G43',
            'prescricao' => "Paracetamol 500mg - 1 comp 8/8h por 3 dias.\nRepouso e hidratação.",
            'status' => 'emitido',
        ]);

        Atestado::create([
            'paciente_id' => $paciente->id,
            'medico_id' => $medico->id,
            'tipo' => 'aptidao',
            'data_emissao' => '2025-10-01',
            'motivo' => 'Para frequentar 4º ano do ensino superior',
            'destino' => 'Matrícula',
            'status' => 'emitido',
        ]);
    }
}
