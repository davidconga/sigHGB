@extends('pdf.layout', [
    'titulo' => 'Relatório de Alta Hospitalar',
    'numero' => $alta->numero,
    'status' => $alta->status,
    'codigoVerificacao' => $alta->codigo_verificacao,
])

@section('content')
    @include('pdf._paciente', ['paciente' => $alta->paciente])

    <table class="info">
        <tr>
            <td class="label">Internamento:</td>
            <td>{{ $alta->data_internamento->format('d/m/Y') }}</td>
            <td class="label">Alta:</td>
            <td>{{ $alta->data_alta->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="label">Serviço:</td>
            <td>{{ $alta->servico ?? '—' }}</td>
            <td class="label">Cama:</td>
            <td>{{ $alta->cama ?? '—' }}</td>
        </tr>
        <tr>
            <td class="label">Condição de alta:</td>
            <td>{{ ucfirst($alta->condicao_alta) }}</td>
            <td class="label">CID:</td>
            <td>{{ $alta->cid ?? '—' }}</td>
        </tr>
    </table>

    @if($alta->diagnostico_admissao)
        <div class="box"><h3>Diagnóstico de admissão</h3><p>{{ $alta->diagnostico_admissao }}</p></div>
    @endif

    <div class="box"><h3>Diagnóstico de alta</h3><p>{{ $alta->diagnostico_alta }}</p></div>

    @if($alta->procedimentos)
        <div class="box"><h3>Procedimentos realizados</h3><p>{{ $alta->procedimentos }}</p></div>
    @endif

    @if($alta->evolucao)
        <div class="box"><h3>Evolução clínica</h3><p>{{ $alta->evolucao }}</p></div>
    @endif

    @if($alta->medicacao_alta)
        <div class="box"><h3>Medicação de alta</h3><p>{{ $alta->medicacao_alta }}</p></div>
    @endif

    @if($alta->recomendacoes)
        <div class="box"><h3>Recomendações</h3><p>{{ $alta->recomendacoes }}</p></div>
    @endif

    @include('pdf._assinatura', ['medico' => $alta->medico])
@endsection
