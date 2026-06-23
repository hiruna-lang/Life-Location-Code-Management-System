<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DuplicateGnAnalysisController extends Controller
{
    public function index(Request $request)
    {
        $provinceId = $request->input('province_id');
        $districtId = $request->input('district_id');

        $sql = "
            SELECT
                p.name_english  AS province_name,
                d.name_english  AS district_name,
                ds.name_english AS ds_name,
                g.name_english  AS gn_name,
                g.lifecode      AS gn_lifecode,
                g.grama_niladhari_division_code AS gn_code,
                g.mpa_code,
                g.id            AS gn_id,
                p.id            AS province_id,
                d.id            AS district_id,
                ds.id           AS ds_id
            FROM grama_niladhari_division g
            JOIN divisional_secretariat ds ON g.divisional_secretariat_id = ds.id
            JOIN district d ON ds.district_id = d.id
            JOIN province p ON d.province_id = p.id
            JOIN (
                SELECT
                    p2.id AS province_id,
                    d2.id AS district_id,
                    LOWER(TRIM(g2.name_english)) AS gn_name_clean
                FROM grama_niladhari_division g2
                JOIN divisional_secretariat ds2 ON g2.divisional_secretariat_id = ds2.id
                JOIN district d2 ON ds2.district_id = d2.id
                JOIN province p2 ON d2.province_id = p2.id
                GROUP BY p2.id, d2.id, LOWER(TRIM(g2.name_english))
                HAVING COUNT(DISTINCT ds2.id) > 1
            ) x ON x.province_id = p.id
                AND x.district_id = d.id
                AND x.gn_name_clean = LOWER(TRIM(g.name_english))
        ";

        $bindings = [];
        $conditions = [];

        if ($provinceId && $provinceId !== 'all') {
            $conditions[] = "p.id = ?";
            $bindings[]   = $provinceId;
        }
        if ($districtId && $districtId !== 'all') {
            $conditions[] = "d.id = ?";
            $bindings[]   = $districtId;
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }

        $sql .= " ORDER BY p.name_english, d.name_english, g.name_english, ds.name_english";

        $results = DB::select($sql, $bindings);

        // Summary counts
        $provinceCount  = count(array_unique(array_column($results, 'province_id')));
        $districtCount  = count(array_unique(array_column($results, 'district_id')));
        $dsCount        = count(array_unique(array_column($results, 'ds_id')));
        $gnGroupCount   = count(array_unique(array_map(fn($r) => $r->province_id.'_'.$r->district_id.'_'.strtolower(trim($r->gn_name)), $results)));

        return response()->json([
            'data'    => $results,
            'summary' => [
                'total_rows'      => count($results),
                'province_count'  => $provinceCount,
                'district_count'  => $districtCount,
                'ds_count'        => $dsCount,
                'gn_group_count'  => $gnGroupCount,
            ],
        ]);
    }
}
