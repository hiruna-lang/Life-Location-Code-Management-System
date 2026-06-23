<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficerDsAssignment extends Model
{
    protected $table = 'officer_ds_assignments';

    protected $fillable = ['user_id', 'divisional_secretariat_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function divisionalSecretariat()
    {
        return $this->belongsTo(DivisionalSecretariat::class, 'divisional_secretariat_id');
    }
}
