<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\District;
use App\Models\DivisionalSecretariat;
use App\Models\GramaNiladhariDivision;
use App\Models\Village;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    public function provinces()
    {
        $provinces = Province::orderBy('name_english')->get(['id', 'name_english', 'name_sinhala', 'name_tamil', 'province_code', 'lifecode']);
        return response()->json($provinces);
    }

    public function districts(Request $request)
    {
        $query = District::orderBy('name_english');
        if ($request->filled('province_id')) {
            $query->where('province_id', $request->province_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil', 'district_code', 'lifecode', 'province_id']));
    }

    public function divisionalSecretariats(Request $request)
    {
        $query = DivisionalSecretariat::orderBy('name_english');
        if ($request->filled('district_id')) {
            $query->where('district_id', $request->district_id);
        }
        return response()->json($query->get(['id', 'name_english', 'name_sinhala', 'name_tamil', 'divisional_secretariat_code', 'lifecode', 'district_id']));
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

    public function lookup(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $term = trim($validated['q']);
        $like = "%{$term}%";
        $matches = static function ($query, string $alias) use ($like) {
            $query->where(function ($names) use ($alias, $like) {
                $names->where("{$alias}.name_english", 'like', $like)
                    ->orWhere("{$alias}.name_sinhala", 'like', $like)
                    ->orWhere("{$alias}.name_tamil", 'like', $like)
                    ->orWhere("{$alias}.lifecode", 'like', $like);
            });
        };

        $results = collect();

        $provinceQuery = DB::table('province as p')
            ->selectRaw("'province' as type, p.id, p.name_english, p.name_sinhala, p.name_tamil, p.lifecode,
                p.id as province_id, p.name_english as province_name, p.lifecode as province_lifecode,
                NULL as district_id, NULL as district_name, NULL as district_lifecode,
                NULL as ds_id, NULL as ds_name, NULL as ds_lifecode,
                NULL as gn_id, NULL as gn_name, NULL as gn_lifecode");
        $matches($provinceQuery, 'p');
        $results = $results->concat($provinceQuery->limit(8)->get());

        $districtQuery = DB::table('district as d')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->selectRaw("'district' as type, d.id, d.name_english, d.name_sinhala, d.name_tamil, d.lifecode,
                p.id as province_id, p.name_english as province_name, p.lifecode as province_lifecode,
                d.id as district_id, d.name_english as district_name, d.lifecode as district_lifecode,
                NULL as ds_id, NULL as ds_name, NULL as ds_lifecode,
                NULL as gn_id, NULL as gn_name, NULL as gn_lifecode");
        $matches($districtQuery, 'd');
        $results = $results->concat($districtQuery->limit(8)->get());

        $dsQuery = DB::table('divisional_secretariat as ds')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->selectRaw("'ds' as type, ds.id, ds.name_english, ds.name_sinhala, ds.name_tamil, ds.lifecode,
                p.id as province_id, p.name_english as province_name, p.lifecode as province_lifecode,
                d.id as district_id, d.name_english as district_name, d.lifecode as district_lifecode,
                ds.id as ds_id, ds.name_english as ds_name, ds.lifecode as ds_lifecode,
                NULL as gn_id, NULL as gn_name, NULL as gn_lifecode");
        $matches($dsQuery, 'ds');
        $results = $results->concat($dsQuery->limit(8)->get());

        $gnQuery = DB::table('grama_niladhari_division as g')
            ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->selectRaw("'gn' as type, g.id, g.name_english, g.name_sinhala, g.name_tamil, g.lifecode,
                p.id as province_id, p.name_english as province_name, p.lifecode as province_lifecode,
                d.id as district_id, d.name_english as district_name, d.lifecode as district_lifecode,
                ds.id as ds_id, ds.name_english as ds_name, ds.lifecode as ds_lifecode,
                g.id as gn_id, g.name_english as gn_name, g.lifecode as gn_lifecode");
        $matches($gnQuery, 'g');
        $results = $results->concat($gnQuery->limit(8)->get());

        $villageQuery = DB::table('village as v')
            ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
            ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->selectRaw("'village' as type, v.id, v.name_english, v.name_sinhala, v.name_tamil, v.lifecode,
                p.id as province_id, p.name_english as province_name, p.lifecode as province_lifecode,
                d.id as district_id, d.name_english as district_name, d.lifecode as district_lifecode,
                ds.id as ds_id, ds.name_english as ds_name, ds.lifecode as ds_lifecode,
                g.id as gn_id, g.name_english as gn_name, g.lifecode as gn_lifecode");
        $matches($villageQuery, 'v');
        $results = $results->concat($villageQuery->limit(8)->get());

        $typeOrder = ['province' => 0, 'district' => 1, 'ds' => 2, 'gn' => 3, 'village' => 4];
        $normalizedTerm = mb_strtolower($term);

        return response()->json($results
            ->sortBy(function ($item) use ($typeOrder, $normalizedTerm) {
                $name = mb_strtolower($item->name_english ?? '');
                $exactRank = $name === $normalizedTerm ? 0 : (str_starts_with($name, $normalizedTerm) ? 1 : 2);
                return sprintf('%d-%d-%s', $exactRank, $typeOrder[$item->type] ?? 9, $name);
            })
            ->take(30)
            ->values());
    }
}
