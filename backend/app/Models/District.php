<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    protected $table = 'district';
    public $timestamps = false;

    protected $fillable = ['name_english', 'name_sinhala', 'name_tamil', 'code', 'province_id'];

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }

    public function divisionalSecretariats()
    {
        return $this->hasMany(DivisionalSecretariat::class, 'district_id');
    }
}
