<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $provinceId = $request->input('province_id');
        $districtId = $request->input('district_id');
        $dsId       = $request->input('ds_id');
        $gnId       = $request->input('gn_id');
        $keyword    = $request->input('keyword');
        $perPage    = min((int) $request->input('per_page', 25), 100);

        $query = DB::table('village as v')
            ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
            ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->select([
                'v.id as village_id',
                'v.name_english as village_name',
                'v.name_sinhala as village_name_sinhala',
                'v.name_tamil as village_name_tamil',
                'v.lifecode as village_lifecode',
                'g.id as gn_id',
                'g.name_english as gn_name',
                'g.name_sinhala as gn_name_sinhala',
                'g.name_tamil as gn_name_tamil',
                'g.lifecode as gn_lifecode',
                'g.grama_niladhari_division_code as gn_code',
                'g.mpa_code',
                'ds.id as ds_id',
                'ds.name_english as ds_name',
                'ds.name_sinhala as ds_name_sinhala',
                'ds.name_tamil as ds_name_tamil',
                'd.id as district_id',
                'd.name_english as district_name',
                'd.name_sinhala as district_name_sinhala',
                'd.name_tamil as district_name_tamil',
                'p.id as province_id',
                'p.name_english as province_name',
                'p.name_sinhala as province_name_sinhala',
                'p.name_tamil as province_name_tamil',
            ]);

        if ($provinceId && $provinceId !== 'all') {
            $query->where('p.id', $provinceId);
        }
        if ($districtId && $districtId !== 'all') {
            $query->where('d.id', $districtId);
        }
        if ($dsId && $dsId !== 'all') {
            $query->where('ds.id', $dsId);
        }
        if ($gnId && $gnId !== 'all') {
            $query->where('g.id', $gnId);
        }
        if ($keyword) {
            $kw = "%{$keyword}%";
            $query->where(function ($q) use ($kw) {
                $q->where('v.name_english',  'like', $kw)
                  ->orWhere('v.name_sinhala', 'like', $kw)
                  ->orWhere('v.name_tamil', 'like', $kw)
                  ->orWhere('g.name_english',  'like', $kw)
                  ->orWhere('g.name_sinhala', 'like', $kw)
                  ->orWhere('g.name_tamil', 'like', $kw)
                  ->orWhere('ds.name_english', 'like', $kw)
                  ->orWhere('ds.name_sinhala', 'like', $kw)
                  ->orWhere('ds.name_tamil', 'like', $kw)
                  ->orWhere('d.name_english',  'like', $kw)
                  ->orWhere('d.name_sinhala', 'like', $kw)
                  ->orWhere('d.name_tamil', 'like', $kw)
                  ->orWhere('p.name_english',  'like', $kw)
                  ->orWhere('p.name_sinhala', 'like', $kw)
                  ->orWhere('p.name_tamil', 'like', $kw)
                  ->orWhere('v.lifecode',       'like', $kw)
                  ->orWhere('g.lifecode',       'like', $kw)
                  ->orWhere('g.grama_niladhari_division_code', 'like', $kw);
            });
        }

        $query->orderBy('p.name_english')
              ->orderBy('d.name_english')
              ->orderBy('ds.name_english')
              ->orderBy('g.name_english')
              ->orderBy('v.name_english');

        $total   = $query->count();
        $results = $query->paginate($perPage);

        return response()->json($results);
    }
}
