<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GramaNiladhariDivision extends Model
{
    protected $table = 'grama_niladhari_division';
    public $timestamps = false;

    protected $fillable = [
        'name_english', 'name_sinhala', 'name_tamil',
        'grama_niladhari_division_code', 'lifecode', 'mpa_code',
        'divisional_secretariat_id'
    ];

    public function divisionalSecretariat()
    {
        return $this->belongsTo(DivisionalSecretariat::class, 'divisional_secretariat_id');
    }

    public function villages()
    {
        return $this->hasMany(Village::class, 'grama_niladhari_division_id');
    }
}
