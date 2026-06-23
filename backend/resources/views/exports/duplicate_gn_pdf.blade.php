<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Duplicate GN Analysis - Life Location Code</title>
<style>
body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #222; }
h2 { color: #1E3A5F; font-size: 13px; margin-bottom: 4px; }
p  { font-size: 8px; color: #555; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
th { background: #7B2D8B; color: #fff; padding: 5px 4px; text-align: left; }
td { border-bottom: 1px solid #eee; padding: 4px; }
tr:nth-child(even) td { background: #fdf5ff; }
</style>
</head>
<body>
<h2>Same GN Name – Different DS Division Analysis</h2>
<p>Generated: {{ now()->format('Y-m-d H:i') }} &mdash; Total Rows: {{ count($results) }}</p>
<table>
    <thead>
        <tr>
            <th>#</th><th>Province</th><th>District</th><th>DS Division</th>
            <th>GN Division</th><th>GN Lifecode</th><th>GN Code</th><th>MPA Code</th><th>GN ID</th>
        </tr>
    </thead>
    <tbody>
        @foreach($results as $i => $row)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $row->province_name }}</td>
            <td>{{ $row->district_name }}</td>
            <td>{{ $row->ds_name }}</td>
            <td>{{ $row->gn_name }}</td>
            <td>{{ $row->gn_lifecode }}</td>
            <td>{{ $row->gn_code }}</td>
            <td>{{ $row->mpa_code }}</td>
            <td>{{ $row->gn_id }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
</body>
</html>
