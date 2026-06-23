<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\District;
use App\Models\DivisionalSecretariat;
use App\Models\GramaNiladhariDivision;
use App\Models\Village;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function provinces()
    {
        $provinces = Province::orderBy('name_english')->get(['id', 'name_english', 'name_sinhala', 'name_tamil']);
        return response()->json($provinces);
    }

    public function districts(Request $request)
    {
        $query = District::orderBy('name_english');
        if ($request->filled('province_id')) {
            $query->where('province_id', $request->province_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil', 'province_id']));
    }

    public function divisionalSecretariats(Request $request)
    {
        $query = DivisionalSecretariat::orderBy('name_english');
        if ($request->filled('district_id')) {
            $query->where('district_id', $request->district_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil', 'district_id']));
    }

    public function gnDivisions(Request $request)
    {
        $query = GramaNiladhariDivision::orderBy('name_english');
        if ($request->filled('ds_id')) {
            $query->where('divisional_secretariat_id', $request->ds_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil',
            'grama_niladhari_division_code', 'lifecode', 'mpa_code', 'divisional_secretariat_id']));
    }

    public function villages(Request $request)
    {
        $query = Village::orderBy('name_english');
        if ($request->filled('gn_id')) {
            $query->where('grama_niladhari_division_id', $request->gn_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil',
            'village_code', 'lifecode', 'grama_niladhari_division_id']));
    }
}
