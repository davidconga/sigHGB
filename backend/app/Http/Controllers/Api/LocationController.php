<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Municipio;
use App\Models\Provincia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function provincias(): JsonResponse
    {
        return response()->json(Provincia::orderBy('nome')->get(['id', 'nome']));
    }

    public function municipios(Request $request): JsonResponse
    {
        $query = Municipio::orderBy('nome');

        if ($pid = $request->integer('provincia_id')) {
            $query->where('provincia_id', $pid);
        } elseif ($nome = $request->string('provincia')->value()) {
            $prov = Provincia::where('nome', $nome)->first();
            if ($prov) {
                $query->where('provincia_id', $prov->id);
            } else {
                return response()->json([]);
            }
        }

        return response()->json($query->get(['id', 'provincia_id', 'nome']));
    }
}
