<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $table = 'province';
    public $timestamps = false;

    protected $fillable = ['name_english', 'name_sinhala', 'name_tamil', 'code'];

    public function districts()
    {
        return $this->hasMany(District::class, 'province_id');
    }
}
