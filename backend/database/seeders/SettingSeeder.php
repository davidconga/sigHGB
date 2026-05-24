<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['notify_medico_atestado_enabled', '1',
                'Enviar SMS ao médico quando um atestado lhe é atribuído (0=desligado, 1=ligado)'],
            ['notify_medico_atestado_template',
                'HGB: Foi-lhe atribuido o atestado {numero} do paciente {paciente}. Aceda ao sistema para emitir.',
                'Template SMS de notificação de atestado. Placeholders: {numero}, {paciente}, {medico}, {tipo_doc}'],
            ['notify_medico_relatorio_enabled', '1',
                'Enviar SMS ao médico quando um relatório lhe é atribuído'],
            ['notify_medico_relatorio_template',
                'HGB: Foi-lhe atribuido o relatorio {numero} ({tipo_doc}) do paciente {paciente}.',
                'Template SMS de notificação de relatório. Placeholders: {numero}, {paciente}, {medico}, {tipo_doc}'],
            ['sms_aniversario_template',
                'Parabéns {nome}! 🎂 O Hospital Geral de Benguela deseja-lhe um feliz aniversário e muitas felicidades neste seu dia especial.',
                'Mensagem enviada automaticamente aos funcionários no dia do aniversário. Placeholders: {nome}, {primeiro_nome}, {saudacao}, {idade}'],
            ['hospital_nome', 'Hospital Geral de Benguela', 'Nome do hospital nos relatórios'],
            ['hospital_endereco', 'Avenida 31 de Janeiro', 'Endereço usado no rodapé'],
            ['hospital_localidade', 'Benguela / Benguela', 'Localidade usada no rodapé'],
            ['directora_nome', 'Dra. Ana Paula Domingues', 'Nome da directora clínica que assina relatórios'],
            ['directora_especialidade', 'Gastroenterologista', 'Especialidade da directora clínica'],
            ['directora_titulo', 'A DIRECTORA CLÍNICA', 'Cabeçalho da assinatura à direita'],
        ];

        foreach ($defaults as [$chave, $valor, $descricao]) {
            Setting::updateOrCreate(['chave' => $chave], compact('valor', 'descricao'));
        }
    }
}
