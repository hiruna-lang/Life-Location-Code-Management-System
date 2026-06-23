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
