<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Paciente extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('paciente');
    }


    protected $table = 'pacientes';

    protected $fillable = [
        'numero_processo', 'nome', 'nome_pai', 'nome_mae',
        'bi', 'bi_emissao_local', 'bi_emissao_data',
        'data_nascimento', 'sexo', 'estado_civil',
        'telefone', 'email', 'endereco', 'bairro', 'municipio', 'provincia',
        'naturalidade_provincia', 'naturalidade_municipio',
        'grupo_sanguineo', 'alergias', 'observacoes',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
        'bi_emissao_data' => 'date',
    ];

    public function getIdadeAttribute(): ?int
    {
        return $this->data_nascimento?->age;
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Paciente $p) {
            if (empty($p->numero_processo)) {
                $year = now()->year;
                $count = static::whereYear('created_at', $year)->count() + 1;
                $p->numero_processo = sprintf('HGB-%d-%06d', $year, $count);
            }
        });
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function exames(): HasMany
    {
        return $this->hasMany(Exame::class);
    }

    public function atestados(): HasMany
    {
        return $this->hasMany(Atestado::class);
    }

    public function altas(): HasMany
    {
        return $this->hasMany(Alta::class);
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(PacienteAnexo::class);
    }
}
