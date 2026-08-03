<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\District;
use App\Models\DivisionalSecretariat;
use App\Models\GramaNiladhariDivision;
use App\Models\Village;
use App\Models\DsVerification;
use App\Models\VerificationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalDs       = DivisionalSecretariat::count();
        $verifiedDs    = DsVerification::where('status', 'final')->orWhere('status', 'locked')->count();
        $nonVerifiedDs = $totalDs - $verifiedDs;

        $lastVerified = DsVerification::whereIn('status', ['final', 'locked'])
            ->orderByDesc('final_at')->value('final_at');

        return response()->json([
            'provinces'       => Province::count(),
            'districts'       => District::count(),
            'ds_divisions'    => $totalDs,
            'gn_divisions'    => GramaNiladhariDivision::count(),
            'villages'        => Village::count(),
            'verified_ds'     => $verifiedDs,
            'non_verified_ds' => $nonVerifiedDs,
            'last_verified'   => $lastVerified,
        ]);
    }

    public function verificationStatus(Request $request)
    {
        $query = DB::table('divisional_secretariat as ds')
            ->leftJoin('ds_verifications as dv', 'ds.id', '=', 'dv.divisional_secretariat_id')
            ->leftJoin('district as d', 'ds.district_id', '=', 'd.id')
            ->leftJoin('province as p', 'd.province_id', '=', 'p.id')
            ->leftJoin('users as u', 'dv.verified_by', '=', 'u.id')
            ->select([
                'p.name_english as province_name',
                'p.name_sinhala as province_name_sinhala',
                'p.name_tamil as province_name_tamil',
                'd.name_english as district_name',
                'd.name_sinhala as district_name_sinhala',
                'd.name_tamil as district_name_tamil',
                'ds.id',
                'ds.name_english as ds_name',
                'ds.name_sinhala as ds_name_sinhala',
                'ds.name_tamil as ds_name_tamil',
                DB::raw("COALESCE(dv.status, 'pending') as status"),
                'dv.final_at', 'dv.locked_at', 'u.name as verified_by_name',
            ]);

        if ($request->filled('province_id')) {
            $query->where('p.id', $request->province_id);
        }
        if ($request->filled('district_id')) {
            $query->where('d.id', $request->district_id);
        }
        if ($request->filled('before_date')) {
            $query->where(function ($q) use ($request) {
                $q->whereNull('dv.final_at')->orWhere('dv.final_at', '>', $request->before_date);
            });
        }

        return response()->json($query->orderBy('p.name_english')->orderBy('d.name_english')->orderBy('ds.name_english')->get());
    }

    public function recentLogs()
    {
        $logs = VerificationLog::with('user')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }
}
