<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
    protected $table = 'provincias';
    protected $fillable = ['nome'];

    public function municipios(): HasMany
    {
        return $this->hasMany(Municipio::class)->orderBy('nome');
    }
}
