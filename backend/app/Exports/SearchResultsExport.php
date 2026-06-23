<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SearchResultsExport implements FromCollection, WithHeadings, WithStyles
{
    protected array $filters;

    public function __construct(array $filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = DB::table('village as v')
            ->join('grama_niladhari_division as g', 'v.grama_niladhari_division_id', '=', 'g.id')
            ->join('divisional_secretariat as ds', 'g.divisional_secretariat_id', '=', 'ds.id')
            ->join('district as d', 'ds.district_id', '=', 'd.id')
            ->join('province as p', 'd.province_id', '=', 'p.id')
            ->select([
                'p.name_english as Province',
                'd.name_english as District',
                'ds.name_english as DS_Division',
                'g.name_english as GN_Division',
                'g.grama_niladhari_division_code as GN_Code',
                'g.lifecode as GN_Lifecode',
                'g.mpa_code as MPA_Code',
                'v.name_english as Village',
                'v.lifecode as Village_Lifecode',
            ]);

        $f = $this->filters;
        if (!empty($f['province_id']) && $f['province_id'] !== 'all') $query->where('p.id', $f['province_id']);
        if (!empty($f['district_id']) && $f['district_id'] !== 'all') $query->where('d.id', $f['district_id']);
        if (!empty($f['ds_id'])       && $f['ds_id']       !== 'all') $query->where('ds.id', $f['ds_id']);
        if (!empty($f['gn_id'])       && $f['gn_id']       !== 'all') $query->where('g.id', $f['gn_id']);
        if (!empty($f['keyword'])) {
            $kw = '%' . $f['keyword'] . '%';
            $query->where(fn($q) => $q->where('v.name_english', 'like', $kw)
                ->orWhere('g.name_english', 'like', $kw)->orWhere('ds.name_english', 'like', $kw));
        }

        return $query->orderBy('p.name_english')->orderBy('d.name_english')
            ->orderBy('ds.name_english')->orderBy('g.name_english')
            ->orderBy('v.name_english')->limit(50000)->get();
    }

    public function headings(): array
    {
        return ['Province', 'District', 'DS Division', 'GN Division', 'GN Code', 'GN Lifecode', 'MPA Code', 'Village', 'Village Lifecode'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF1E3A5F']]]];
    }
}
