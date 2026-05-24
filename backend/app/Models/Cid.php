<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cid extends Model
{
    protected $table = 'cids';

    protected $fillable = ['codigo', 'descricao', 'capitulo', 'ativo'];

    protected $casts = ['ativo' => 'boolean'];
}
