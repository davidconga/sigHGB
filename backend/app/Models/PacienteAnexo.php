<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PacienteAnexo extends Model
{
    protected $table = 'paciente_anexos';

    protected $fillable = [
        'paciente_id', 'tipo', 'descricao', 'path',
        'original_name', 'mime', 'size', 'uploaded_by',
    ];

    protected $appends = ['url'];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn () => $this->path ? Storage::disk('public')->url($this->path) : null);
    }
}
