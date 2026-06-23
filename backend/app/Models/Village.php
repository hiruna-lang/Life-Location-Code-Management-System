<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Village extends Model
{
    protected $table = 'village';
    public $timestamps = false;

    protected $fillable = [
        'name_english', 'name_sinhala', 'name_tamil',
        'village_code', 'lifecode',
        'grama_niladhari_division_id'
    ];

    public function gramaNiladhariDivision()
    {
        return $this->belongsTo(GramaNiladhariDivision::class, 'grama_niladhari_division_id');
    }
}
