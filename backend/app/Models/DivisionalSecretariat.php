<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DivisionalSecretariat extends Model
{
    protected $table = 'divisional_secretariat';
    public $timestamps = false;

    protected $fillable = ['name_english', 'name_sinhala', 'name_tamil', 'code', 'district_id'];

    public function district()
    {
        return $this->belongsTo(District::class, 'district_id');
    }

    public function gramaNiladhariDivisions()
    {
        return $this->hasMany(GramaNiladhariDivision::class, 'divisional_secretariat_id');
    }

    public function verification()
    {
        return $this->hasOne(DsVerification::class, 'divisional_secretariat_id');
    }
}
