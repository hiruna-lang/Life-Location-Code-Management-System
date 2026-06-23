<?php

namespace App\Http\Middleware;

use App\Models\ApiAccessLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogApiAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            ApiAccessLog::create([
                'endpoint'      => $request->path(),
                'method'        => $request->method(),
                'ip_address'    => $request->ip(),
                'query_params'  => json_encode($request->query()),
                'response_code' => $response->getStatusCode(),
                'user_id'       => $request->user()?->id,
                'accessed_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            // Never fail the request due to logging
        }

        return $response;
    }
}
