@extends('pdf.layout', [
    'titulo' => 'Relatório de Exame Laboratorial',
    'numero' => $exame->numero,
    'status' => $exame->status,
    'codigoVerificacao' => $exame->codigo_verificacao,
])

@section('content')
    @include('pdf._paciente', ['paciente' => $exame->paciente])

    <table class="info">
        <tr>
            <td class="label">Data de realização:</td>
            <td>{{ $exame->data_realizacao->format('d/m/Y') }}</td>
            <td class="label">Tipo:</td>
            <td>{{ $exame->tipo_exame }}</td>
        </tr>
        @if($exame->material)
            <tr>
                <td class="label">Material:</td>
                <td colspan="3">{{ $exame->material }}</td>
            </tr>
        @endif
    </table>

    @if(!empty($exame->parametros) && is_array($exame->parametros))
        <div class="box">
            <h3>Parâmetros</h3>
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:#f2f2f2;">
                        <th style="text-align:left; padding:4px; border:1px solid #ccc;">Parâmetro</th>
                        <th style="text-align:left; padding:4px; border:1px solid #ccc;">Resultado</th>
                        <th style="text-align:left; padding:4px; border:1px solid #ccc;">Unidade</th>
                        <th style="text-align:left; padding:4px; border:1px solid #ccc;">Referência</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($exame->parametros as $p)
                        <tr>
                            <td style="padding:4px; border:1px solid #eee;">{{ $p['nome'] ?? '' }}</td>
                            <td style="padding:4px; border:1px solid #eee;">{{ $p['valor'] ?? '' }}</td>
                            <td style="padding:4px; border:1px solid #eee;">{{ $p['unidade'] ?? '' }}</td>
                            <td style="padding:4px; border:1px solid #eee;">{{ $p['referencia'] ?? '' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <div class="box"><h3>Resultado</h3><p>{{ $exame->resultado }}</p></div>

    @if($exame->interpretacao)
        <div class="box"><h3>Interpretação</h3><p>{{ $exame->interpretacao }}</p></div>
    @endif

    @if($exame->observacoes)
        <div class="box"><h3>Observações</h3><p>{{ $exame->observacoes }}</p></div>
    @endif

    @include('pdf._assinatura', ['medico' => $exame->medico])
@endsection
