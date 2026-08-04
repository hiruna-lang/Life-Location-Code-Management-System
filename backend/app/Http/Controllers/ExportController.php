<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\SearchResultsExport;
use App\Exports\DuplicateGnExport;

class ExportController extends Controller
{
    public function exportSearchExcel(Request $request)
    {
        return Excel::download(new SearchResultsExport($request->all()), 'search_results.xlsx');
    }

    public function exportSearchPdf(Request $request)
    {
        $data = $this->getSearchData($request);
        $pdf  = Pdf::loadView('exports.search_pdf', ['results' => $data])->setPaper('a4', 'landscape');
        return $pdf->download('search_results.pdf');
    }

    public function exportListingExcel(Request $request)
    {
        return Excel::download(new SearchResultsExport($request->all()), 'location_listing.xlsx');
    }

    public function exportListingPdf(Request $request)
    {
        $data = $this->getListingData($request);
        $pdf  = Pdf::loadView('exports.search_pdf', ['results' => $data])->setPaper('a4', 'landscape');
        return $pdf->download('location_listing.pdf');
    }

    public function exportDuplicateGnExcel(Request $request)
    {
        return Excel::download(new DuplicateGnExport($request->all()), 'duplicate_gn_analysis.xlsx');
    }

    public function exportDuplicateGnPdf(Request $request)
    {
        $data = $this->getDuplicateGnData($request);
        $pdf  = Pdf::loadView('exports.duplicate_gn_pdf', ['results' => $data])->setPaper('a4', 'landscape');
        return $pdf->download('duplicate_gn_analysis.pdf');
    }

    private function getSearchData(Request $request): array
    {
        $query = DB::table('village as v')
            ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
            ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->select(['p.name_english as province_name','d.name_english as district_name',
                'ds.name_english as ds_name','g.name_english as gn_name',
                'g.lifecode as gn_lifecode','v.name_english as village_name','v.lifecode as village_lifecode']);

        $this->applySearchFilters($query, $request);

        return $query->orderBy('p.name_english')->orderBy('d.name_english')
            ->orderBy('ds.name_english')->orderBy('g.name_english')
            ->orderBy('v.name_english')->limit(10000)->get()->toArray();
    }

    private function getListingData(Request $request): array
    {
        $provinceId      = $request->input('province_id');
        $districtId      = $request->input('district_id');
        $dsId            = $request->input('ds_id');
        $gnId            = $request->input('gn_id');
        $includeVillages = $request->boolean('include_villages', false);
        $sortBy          = $request->input('sort_by', 'name');

        $provinceColumns = [
            'p.name_english as province_name', 'p.name_sinhala as province_name_sinhala',
            'p.name_tamil as province_name_tamil', 'p.lifecode as province_lifecode',
        ];
        $districtColumns = [
            'd.name_english as district_name', 'd.name_sinhala as district_name_sinhala',
            'd.name_tamil as district_name_tamil', 'd.lifecode as district_lifecode',
        ];
        $dsColumns = [
            'ds.name_english as ds_name', 'ds.name_sinhala as ds_name_sinhala',
            'ds.name_tamil as ds_name_tamil', 'ds.lifecode as ds_lifecode',
            'ds.divisional_secretariat_code as ds_code',
        ];
        $gnColumns = [
            'g.name_english as gn_name', 'g.name_sinhala as gn_name_sinhala',
            'g.name_tamil as gn_name_tamil', 'g.lifecode as gn_lifecode',
            'g.grama_niladhari_division_code as gn_code',
        ];
        $villageColumns = [
            'v.name_english as village_name', 'v.name_sinhala as village_name_sinhala',
            'v.name_tamil as village_name_tamil', 'v.lifecode as village_lifecode',
        ];

        if ($provinceId === 'none') {
            $level = 'none';
        } elseif ($districtId === 'none') {
            $level = 'province';
        } elseif ($dsId === 'none') {
            $level = 'district';
        } elseif ($gnId === 'none') {
            $level = 'ds';
        } elseif ($includeVillages) {
            $level = 'village';
        } else {
            $level = 'gn';
        }

        switch ($level) {
            case 'none':
                return [];
            case 'province':
                $query = DB::table('province as p')
                    ->select($provinceColumns);
                break;
            case 'district':
                $query = DB::table('district as d')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns));
                break;
            case 'ds':
                $query = DB::table('divisional_secretariat as ds')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns));
                break;
            case 'village':
                $query = DB::table('village as v')
                    ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
                    ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns, $gnColumns, $villageColumns));
                break;
            default:
                $query = DB::table('grama_niladhari_division as g')
                    ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
                    ->join('district as d', 'ds.district_id', '=', 'd.id')
                    ->join('province as p', 'd.province_id', '=', 'p.id')
                    ->select(array_merge($provinceColumns, $districtColumns, $dsColumns, $gnColumns));
                break;
        }

        $this->applySearchFilters($query, $request);

        if ($sortBy === 'code') {
            $query->reorder();
            switch ($level) {
                case 'province':
                    $query->orderBy('p.lifecode', 'asc')
                           ->orderBy('p.name_english', 'asc');
                    break;
                case 'district':
                    $query->orderBy('d.lifecode', 'asc')
                           ->orderBy('d.name_english', 'asc')
                           ->orderBy('p.name_english', 'asc');
                    break;
                case 'ds':
                    $query->orderBy('ds.lifecode', 'asc')
                           ->orderBy('ds.name_english', 'asc')
                           ->orderBy('d.name_english', 'asc')
                           ->orderBy('p.name_english', 'asc');
                    break;
                case 'village':
                    $query->orderBy('v.lifecode', 'asc')
                           ->orderBy('v.name_english', 'asc')
                           ->orderBy('g.name_english', 'asc')
                           ->orderBy('ds.name_english', 'asc')
                           ->orderBy('d.name_english', 'asc')
                           ->orderBy('p.name_english', 'asc');
                    break;
                default:
                    $query->orderBy('g.lifecode', 'asc')
                           ->orderBy('g.name_english', 'asc')
                           ->orderBy('ds.name_english', 'asc')
                           ->orderBy('d.name_english', 'asc')
                           ->orderBy('p.name_english', 'asc');
                    break;
            }
        } else {
            $query->orderBy('p.name_english');
            if ($level !== 'district') {
                $query->orderBy('d.name_english');
            }
            if (in_array($level, ['ds', 'village', 'gn'], true)) {
                $query->orderBy('ds.name_english');
            }
            if (in_array($level, ['village', 'gn'], true)) {
                $query->orderBy('g.name_english');
            }
            if ($level === 'village') {
                $query->orderBy('v.name_english');
            }
        }

        return $query->limit(10000)->get()->toArray();
    }

    private function applySearchFilters($query, Request $request): void
    {
        if ($request->filled('province_id') && $request->province_id !== 'all') {
            $query->where('p.id', $request->province_id);
        }
        if ($request->filled('district_id') && $request->district_id !== 'all') {
            $query->where('d.id', $request->district_id);
        }
        if ($request->filled('ds_id') && $request->ds_id !== 'all') {
            $query->where('ds.id', $request->ds_id);
        }
        if ($request->filled('gn_id') && $request->gn_id !== 'all') {
            $query->where('g.id', $request->gn_id);
        }
        if ($request->filled('keyword')) {
            $kw = "%{$request->keyword}%";
            $query->where(function ($q) use ($kw) {
                $q->where('v.name_english', 'like', $kw)
                  ->orWhere('g.name_english', 'like', $kw)
                  ->orWhere('ds.name_english', 'like', $kw);
            });
        }
    }

    private function getDuplicateGnData(Request $request): array
    {
        $sql = "SELECT p.name_english AS province_name, d.name_english AS district_name,
            ds.name_english AS ds_name, g.name_english AS gn_name, g.lifecode AS gn_lifecode,
            g.grama_niladhari_division_code AS gn_code, g.mpa_code, g.id AS gn_id
            FROM grama_niladhari_division g
            JOIN divisional_secretariat ds ON g.divisional_secretariat_id = ds.id
            JOIN district d ON ds.district_id = d.id
            JOIN province p ON d.province_id = p.id
            JOIN (
                SELECT p2.id AS province_id, d2.id AS district_id, LOWER(TRIM(g2.name_english)) AS gn_name_clean
                FROM grama_niladhari_division g2
                JOIN divisional_secretariat ds2 ON g2.divisional_secretariat_id = ds2.id
                JOIN district d2 ON ds2.district_id = d2.id
                JOIN province p2 ON d2.province_id = p2.id
                GROUP BY p2.id, d2.id, LOWER(TRIM(g2.name_english))
                HAVING COUNT(DISTINCT ds2.id) > 1
            ) x ON x.province_id = p.id AND x.district_id = d.id AND x.gn_name_clean = LOWER(TRIM(g.name_english))
            ORDER BY p.name_english, d.name_english, g.name_english, ds.name_english";

        return DB::select($sql);
    }
}
