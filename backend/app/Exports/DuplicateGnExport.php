<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;

class DuplicateGnExport implements FromCollection, WithHeadings, WithStyles
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection(): Collection
    {
        $sql = "SELECT p.name_english AS Province, d.name_english AS District,
            ds.name_english AS DS_Division, g.name_english AS GN_Division,
            g.lifecode AS GN_Lifecode, g.grama_niladhari_division_code AS GN_Code,
            g.mpa_code AS MPA_Code, g.id AS GN_ID
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

        return collect(DB::select($sql))->map(fn($r) => (array) $r);
    }

    public function headings(): array
    {
        return ['Province', 'District', 'DS Division', 'GN Division', 'GN Lifecode', 'GN Code', 'MPA Code', 'GN ID'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF1E3A5F']]]];
    }
}
