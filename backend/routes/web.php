<?php

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Route;

$serveSpa = function () {
    $path = public_path('index.html');
    if (! is_file($path)) {
        return response('SPA build not found. Run `npm run build` in frontend/ and copy dist/* into backend/public/.', 503);
    }
    return new Response(file_get_contents($path), 200, ['Content-Type' => 'text/html']);
};

Route::get('/', $serveSpa);
Route::fallback($serveSpa);
