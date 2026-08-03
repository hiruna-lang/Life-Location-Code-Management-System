<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Location Listing - Life Location Code</title>
<style>
body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #222; }
h2 { color: #1E3A5F; font-size: 13px; margin-bottom: 4px; }
p  { font-size: 8px; color: #555; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
th { background: #1E3A5F; color: #fff; padding: 5px 4px; text-align: left; }
td { border-bottom: 1px solid #eee; padding: 4px; }
tr:nth-child(even) td { background: #f5f8fc; }
</style>
</head>
<body>
<h2>Life Location Code Management System</h2>
<p>Location Listing Export &mdash; Generated: {{ now()->format('Y-m-d H:i') }}</p>
<table>
    <thead>
        <tr>
            <th>#</th>
            <th>Province</th>
            <th>Province Life Code</th>
            @if(count($results) > 0 && isset($results[0]->district_name))
            <th>District</th><th>District Life Code</th>
            @endif
            @if(count($results) > 0 && isset($results[0]->ds_name))
            <th>DS Division</th><th>DS Life Code</th>
            @endif
            @if(count($results) > 0 && isset($results[0]->gn_name))
            <th>GN Division</th><th>GN Life Code</th>
            @endif
            @if(count($results) > 0 && isset($results[0]->village_name))
            <th>Village</th><th>Village Life Code</th>
            @endif
        </tr>
    </thead>
    <tbody>
        @foreach($results as $i => $row)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $row->province_name ?? '' }}</td>
            <td>{{ $row->province_lifecode ?? '' }}</td>
            @if(isset($row->district_name))
            <td>{{ $row->district_name ?? '' }}</td>
            <td>{{ $row->district_lifecode ?? '' }}</td>
            @endif
            @if(isset($row->ds_name))
            <td>{{ $row->ds_name ?? '' }}</td>
            <td>{{ $row->ds_lifecode ?? '' }}</td>
            @endif
            @if(isset($row->gn_name))
            <td>{{ $row->gn_name ?? '' }}</td>
            <td>{{ $row->gn_lifecode ?? '' }}</td>
            @endif
            @if(isset($row->village_name))
            <td>{{ $row->village_name ?? '' }}</td>
            <td>{{ $row->village_lifecode ?? '' }}</td>
            @endif
        </tr>
        @endforeach
    </tbody>
</table>
<p style="margin-top:10px">Total Records: {{ count($results) }}</p>
</body>
</html>
