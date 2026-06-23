<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiAccessLog extends Model
{
    protected $table = 'api_access_logs';
    public $timestamps = false;

    protected $fillable = [
        'endpoint', 'method', 'ip_address',
        'query_params', 'response_code', 'user_id', 'accessed_at'
    ];

    protected $casts = ['accessed_at' => 'datetime'];
}
