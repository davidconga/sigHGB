<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Valida que o utilizador autenticado é o médico atribuído ao documento,
 * comparando nº de ordem e password. Lança 403/422 com mensagem clara.
 */
class AssinaturaValidator
{
    public static function validar(Request $request, int $medicoIdDoc): \App\Models\Medico
    {
        $request->validate([
            'numero_ordem' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();
        if (! $user) {
            throw new HttpException(401, 'Sem sessão.');
        }

        if (! $user->medico_id || $user->medico_id !== $medicoIdDoc) {
            throw new HttpException(403, 'Só o médico atribuído ao documento pode assiná-lo.');
        }

        if (! Hash::check($request->input('password'), $user->password)) {
            throw new HttpException(422, 'Palavra-passe incorrecta.');
        }

        $medico = $user->medico;
        if (! $medico) {
            throw new HttpException(403, 'Utilizador não tem médico associado.');
        }

        if (strcasecmp(trim($medico->numero_ordem), trim($request->input('numero_ordem'))) !== 0) {
            throw new HttpException(422, 'Nº de ordem não corresponde ao seu registo.');
        }

        return $medico;
    }
}
