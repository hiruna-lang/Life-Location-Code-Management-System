<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationLog extends Model
{
    protected $table = 'verification_logs';

    public $timestamps = true;
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'divisional_secretariat_id', 'action',
        'description', 'old_data', 'new_data', 'ip_address'
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
