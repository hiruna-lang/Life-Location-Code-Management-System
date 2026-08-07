<?php

namespace App\Http\Middleware;

use App\Models\ApiAccessLog;
use App\Models\User;
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
                // Guest tokens belong to ApiClient records, not users. Avoid
                // recording an unrelated user that happens to share the ID.
                'user_id'       => $request->user() instanceof User
                    ? $request->user()->id
                    : null,
                'accessed_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            // Never fail the request due to logging
        }

        return $response;
    }
}
