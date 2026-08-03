<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $provinceId      = $request->input('province_id');
        $districtId      = $request->input('district_id');
        $dsId            = $request->input('ds_id');
        $gnId            = $request->input('gn_id');
        $keyword         = $request->input('keyword');
        $includeVillages = $request->boolean('include_villages', true);
        $sortBy          = $request->input('sort_by', 'name');
        $perPage         = min((int) $request->input('per_page', 10), 100);

        $deepestLevel = $this->determineDeepestLevel($provinceId, $districtId, $dsId, $gnId, $includeVillages);

        return $this->searchByLevel($deepestLevel, $provinceId, $districtId, $dsId, $gnId, $keyword, $sortBy, $perPage);
    }

    private function determineDeepestLevel($provinceId, $districtId, $dsId, $gnId, $includeVillages)
    {
        if ($provinceId === 'none') {
            return 'none';
        }
        if ($districtId === 'none') {
            return 'province';
        }
        if ($dsId === 'none') {
            return 'district';
        }
        if ($gnId === 'none') {
            return 'ds';
        }
        if ($includeVillages) {
            return 'village';
        }
        return 'gn';
    }

    private function searchByLevel($level, $provinceId, $districtId, $dsId, $gnId, $keyword, $sortBy, $perPage)
    {
        $provinceColumns = [
            'p.id as province_id',
            'p.name_english as province_name',
            'p.name_sinhala as province_name_sinhala',
            'p.name_tamil as province_name_tamil',
            'p.province_code as province_code',
            'p.lifecode as province_lifecode',
        ];

        $districtColumns = [
            'd.id as district_id',
            'd.name_english as district_name',
            'd.name_sinhala as district_name_sinhala',
            'd.name_tamil as district_name_tamil',
            'd.district_code as district_code',
            'd.lifecode as district_lifecode',
        ];

        $dsColumns = [
            'ds.id as ds_id',
            'ds.name_english as ds_name',
            'ds.name_sinhala as ds_name_sinhala',
            'ds.name_tamil as ds_name_tamil',
            'ds.divisional_secretariat_code as ds_code',
            'ds.lifecode as ds_lifecode',
        ];

        $gnColumns = [
            'g.id as gn_id',
            'g.name_english as gn_name',
            'g.name_sinhala as gn_name_sinhala',
            'g.name_tamil as gn_name_tamil',
            'g.lifecode as gn_lifecode',
            'g.grama_niladhari_division_code as gn_code',
            'g.mpa_code',
        ];

        $villageColumns = [
            'v.id as village_id',
            'v.name_english as village_name',
            'v.name_sinhala as village_name_sinhala',
            'v.name_tamil as village_name_tamil',
            'v.lifecode as village_lifecode',
        ];

        switch ($level) {
            case 'none':
                return response()->json([
                    'data' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                    'per_page' => $perPage,
                ]);

            case 'province':
                $query = DB::table('province as p')
                    ->select($provinceColumns)
                    ->orderBy('p.name_english');

                $this->applyKeywordToQuery($query, $keyword, ['p']);
                break;

            case 'district':
                $query = DB::table('district as d')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns))
                    ->orderBy('p.name_english')
                    ->orderBy('d.name_english');

                $this->applyFiltersToQuery($query, $provinceId, $districtId, null, null);
                $this->applyKeywordToQuery($query, $keyword, ['p', 'd']);
                break;

            case 'ds':
                $query = DB::table('divisional_secretariat as ds')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns))
                    ->orderBy('p.name_english')
                    ->orderBy('d.name_english')
                    ->orderBy('ds.name_english');

                $this->applyFiltersToQuery($query, $provinceId, $districtId, $dsId, null);
                $this->applyKeywordToQuery($query, $keyword, ['p', 'd', 'ds']);
                break;

            case 'gn':
                $query = DB::table('grama_niladhari_division as g')
                    ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns, $gnColumns))
                    ->orderBy('p.name_english')
                    ->orderBy('d.name_english')
                    ->orderBy('ds.name_english')
                    ->orderBy('g.name_english');

                $this->applyFiltersToQuery($query, $provinceId, $districtId, $dsId, $gnId);
                $this->applyKeywordToQuery($query, $keyword, ['p', 'd', 'ds', 'g']);
                break;

            case 'village':
            default:
                $query = DB::table('village as v')
                    ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
                    ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns, $gnColumns, $villageColumns))
                    ->orderBy('p.name_english')
                    ->orderBy('d.name_english')
                    ->orderBy('ds.name_english')
                    ->orderBy('g.name_english')
                    ->orderBy('v.name_english');

                $this->applyFiltersToQuery($query, $provinceId, $districtId, $dsId, $gnId);
                $this->applyKeywordToQuery($query, $keyword, ['p', 'd', 'ds', 'g', 'v']);
                break;
        }

        $this->applySorting($query, $sortBy, $level);

        return response()->json($query->paginate($perPage));
    }

    private function applySorting($query, $sortBy, $level)
    {
        if ($sortBy === 'code') {
            switch ($level) {
                case 'province':
                    $query->reorder('p.lifecode', 'asc');
                    break;
                case 'district':
                    $query->reorder('d.lifecode', 'asc');
                    break;
                case 'ds':
                    $query->reorder('ds.lifecode', 'asc');
                    break;
                case 'gn':
                    $query->reorder('g.lifecode', 'asc');
                    break;
                case 'village':
                    $query->reorder('v.lifecode', 'asc');
                    break;
            }
        }
    }

    private function applyFiltersToQuery($query, $provinceId, $districtId, $dsId, $gnId)
    {
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
    }

    private function applyKeywordToQuery($query, $keyword, array $availableTables)
    {
        if (!$keyword) {
            return;
        }

        $kw = "%{$keyword}%";
        $query->where(function ($q) use ($kw, $availableTables) {
            $tableAliases = [
                'p' => [
                    'p.name_english', 'p.name_sinhala', 'p.name_tamil',
                    'p.lifecode', 'p.province_code',
                ],
                'd' => [
                    'd.name_english', 'd.name_sinhala', 'd.name_tamil',
                    'd.lifecode', 'd.district_code',
                ],
                'ds' => [
                    'ds.name_english', 'ds.name_sinhala', 'ds.name_tamil',
                    'ds.lifecode', 'ds.divisional_secretariat_code',
                ],
                'g' => [
                    'g.name_english', 'g.name_sinhala', 'g.name_tamil',
                    'g.lifecode', 'g.grama_niladhari_division_code',
                ],
                'v' => [
                    'v.name_english', 'v.name_sinhala', 'v.name_tamil',
                    'v.lifecode',
                ],
            ];

            $first = true;
            foreach ($availableTables as $table) {
                if (!isset($tableAliases[$table])) {
                    continue;
                }
                foreach ($tableAliases[$table] as $column) {
                    if ($first) {
                        $q->where($column, 'like', $kw);
                        $first = false;
                    } else {
                        $q->orWhere($column, 'like', $kw);
                    }
                }
            }
        });
    }
}
