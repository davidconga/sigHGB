<?php

namespace Database\Seeders;

use App\Models\Cid;
use Illuminate\Database\Seeder;

class CidSeeder extends Seeder
{
    public function run(): void
    {
        $cids = [
            // Doenças infecciosas (A00-B99)
            ['A00', 'Cólera', 'Doenças infecciosas e parasitárias'],
            ['A01', 'Febre tifóide e paratifóide', 'Doenças infecciosas e parasitárias'],
            ['A09', 'Diarreia e gastroenterite de origem infecciosa presumível', 'Doenças infecciosas e parasitárias'],
            ['A15', 'Tuberculose respiratória, com confirmação bacteriológica e histológica', 'Doenças infecciosas e parasitárias'],
            ['A16', 'Tuberculose respiratória, sem confirmação', 'Doenças infecciosas e parasitárias'],
            ['B20', 'Doença pelo vírus da imunodeficiência humana (HIV)', 'Doenças infecciosas e parasitárias'],
            ['B50', 'Malária por Plasmodium falciparum', 'Doenças infecciosas e parasitárias'],
            ['B54', 'Malária não especificada', 'Doenças infecciosas e parasitárias'],
            ['B73', 'Oncocercose', 'Doenças infecciosas e parasitárias'],
            ['B74', 'Filariose', 'Doenças infecciosas e parasitárias'],

            // Neoplasias / Sangue
            ['D50', 'Anemia por deficiência de ferro', 'Doenças do sangue'],
            ['D57', 'Transtornos falciformes', 'Doenças do sangue'],

            // Endócrinas
            ['E10', 'Diabetes mellitus tipo 1', 'Doenças endócrinas, nutricionais e metabólicas'],
            ['E11', 'Diabetes mellitus tipo 2', 'Doenças endócrinas, nutricionais e metabólicas'],
            ['E44', 'Desnutrição protéico-calórica de grau moderado e leve', 'Doenças endócrinas, nutricionais e metabólicas'],
            ['E66', 'Obesidade', 'Doenças endócrinas, nutricionais e metabólicas'],

            // Mentais
            ['F32', 'Episódio depressivo', 'Transtornos mentais e comportamentais'],
            ['F41', 'Outros transtornos ansiosos', 'Transtornos mentais e comportamentais'],

            // Sistema nervoso
            ['G40', 'Epilepsia', 'Doenças do sistema nervoso'],
            ['G43', 'Enxaqueca', 'Doenças do sistema nervoso'],

            // Olhos / Ouvidos
            ['H10', 'Conjuntivite', 'Doenças do olho e anexos'],
            ['H66', 'Otite média supurativa e não especificada', 'Doenças do ouvido'],

            // Circulatório
            ['I10', 'Hipertensão essencial (primária)', 'Doenças do aparelho circulatório'],
            ['I50', 'Insuficiência cardíaca', 'Doenças do aparelho circulatório'],
            ['I64', 'Acidente vascular cerebral, não especificado', 'Doenças do aparelho circulatório'],

            // Respiratório
            ['J00', 'Nasofaringite aguda (resfriado comum)', 'Doenças do aparelho respiratório'],
            ['J02', 'Faringite aguda', 'Doenças do aparelho respiratório'],
            ['J03', 'Amigdalite aguda', 'Doenças do aparelho respiratório'],
            ['J18', 'Pneumonia por microorganismo não especificado', 'Doenças do aparelho respiratório'],
            ['J44', 'Doença pulmonar obstrutiva crónica (DPOC)', 'Doenças do aparelho respiratório'],
            ['J45', 'Asma', 'Doenças do aparelho respiratório'],

            // Digestivo
            ['K29', 'Gastrite e duodenite', 'Doenças do aparelho digestivo'],
            ['K35', 'Apendicite aguda', 'Doenças do aparelho digestivo'],
            ['K59', 'Outros transtornos funcionais do intestino', 'Doenças do aparelho digestivo'],

            // Pele
            ['L23', 'Dermatite alérgica de contacto', 'Doenças da pele e tecido subcutâneo'],
            ['L30', 'Outras dermatites', 'Doenças da pele e tecido subcutâneo'],

            // Músculo-esquelético
            ['M54', 'Dorsalgia', 'Doenças do sistema osteomuscular'],
            ['M79', 'Outros transtornos dos tecidos moles', 'Doenças do sistema osteomuscular'],

            // Geniturinário
            ['N39', 'Outros transtornos do trato urinário', 'Doenças do aparelho geniturinário'],

            // Gravidez / Parto
            ['O80', 'Parto único espontâneo', 'Gravidez, parto e puerpério'],
            ['O82', 'Parto único por cesariana', 'Gravidez, parto e puerpério'],

            // Sintomas
            ['R10', 'Dor abdominal e pélvica', 'Sintomas e sinais'],
            ['R50', 'Febre de origem desconhecida', 'Sintomas e sinais'],
            ['R51', 'Cefaleia', 'Sintomas e sinais'],
            ['R53', 'Mal-estar e fadiga', 'Sintomas e sinais'],

            // Lesões
            ['S06', 'Traumatismo intracraniano', 'Lesões e envenenamentos'],
            ['T14', 'Traumatismo de região não especificada', 'Lesões e envenenamentos'],

            // Z (motivos de contacto)
            ['Z00', 'Exame geral e investigação de pessoas sem queixa', 'Fatores que influenciam o estado de saúde'],
            ['Z02', 'Exame médico para fins administrativos', 'Fatores que influenciam o estado de saúde'],
            ['Z76', 'Pessoas em contacto com os serviços de saúde, outras circunstâncias', 'Fatores que influenciam o estado de saúde'],
        ];

        foreach ($cids as [$codigo, $descricao, $capitulo]) {
            Cid::updateOrCreate(['codigo' => $codigo], [
                'descricao' => $descricao,
                'capitulo' => $capitulo,
            ]);
        }
    }
}
