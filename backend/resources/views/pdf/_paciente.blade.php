<table class="info">
    <tr>
        <td class="label">Paciente:</td>
        <td>{{ $paciente->nome }}</td>
        <td class="label">Processo:</td>
        <td>{{ $paciente->numero_processo }}</td>
    </tr>
    <tr>
        <td class="label">BI:</td>
        <td>{{ $paciente->bi ?? '—' }}</td>
        <td class="label">Sexo:</td>
        <td>{{ $paciente->sexo === 'F' ? 'Feminino' : ($paciente->sexo === 'M' ? 'Masculino' : '—') }}</td>
    </tr>
    <tr>
        <td class="label">Data nasc.:</td>
        <td>{{ $paciente->data_nascimento?->format('d/m/Y') ?? '—' }}</td>
        <td class="label">Telefone:</td>
        <td>{{ $paciente->telefone ?? '—' }}</td>
    </tr>
</table>
