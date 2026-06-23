<?php

namespace App\Http\Controllers;

use App\Models\ApiAccessLog;
use Illuminate\Http\Request;

class ApiLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ApiAccessLog::query()->orderByDesc('accessed_at');

        if ($request->filled('endpoint')) {
            $query->where('endpoint', 'like', '%' . $request->endpoint . '%');
        }
        if ($request->filled('date_from')) {
            $query->where('accessed_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('accessed_at', '<=', $request->date_to . ' 23:59:59');
        }
        if ($request->filled('ip')) {
            $query->where('ip_address', 'like', '%' . $request->ip . '%');
        }

        return response()->json($query->paginate(50));
    }

    public function summary()
    {
        $today    = now()->toDateString();
        $week     = now()->subDays(7)->toDateString();
        $topEndpoints = ApiAccessLog::selectRaw('endpoint, COUNT(*) as hits')
            ->groupBy('endpoint')->orderByDesc('hits')->limit(10)->get();

        return response()->json([
            'today'         => ApiAccessLog::whereDate('accessed_at', $today)->count(),
            'last_7_days'   => ApiAccessLog::where('accessed_at', '>=', $week)->count(),
            'total'         => ApiAccessLog::count(),
            'top_endpoints' => $topEndpoints,
        ]);
    }
}
