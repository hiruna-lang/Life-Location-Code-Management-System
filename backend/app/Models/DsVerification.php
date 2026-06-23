<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DsVerification extends Model
{
    protected $table = 'ds_verifications';

    protected $fillable = [
        'divisional_secretariat_id', 'verified_by', 'status',
        'draft_at', 'final_at', 'locked_at', 'locked_by', 'notes'
    ];

    protected $casts = [
        'draft_at'  => 'datetime',
        'final_at'  => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function divisionalSecretariat()
    {
        return $this->belongsTo(DivisionalSecretariat::class, 'divisional_secretariat_id');
    }

    public function verifiedByUser()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function lockedByUser()
    {
        return $this->belongsTo(User::class, 'locked_by');
    }
}
