import React from 'react'

const renderHtml = ({ dsName, finalAt, gns }) => {
  const rows = gns.map((gn, i) => `
    <tr${i % 2 === 0 ? '' : ' style="background:#f9f9f9"'}>
      <td style="padding:7px 9px;border:1px solid #bbb;font-size:10pt">${gn.name_english}</td>
      <td style="padding:7px 9px;border:1px solid #bbb;font-size:10pt;text-align:center">${gn.grama_niladhari_division_code || '—'}</td>
      <td style="padding:7px 9px;border:1px solid #bbb;font-size:10pt;text-align:center">${gn.lifecode || '—'}</td>
      <td style="padding:7px 9px;border:1px solid #bbb;font-size:10pt;text-align:center">${(gn.villages || []).length}</td>
    </tr>
  `).join('')

  const ft = finalAt
    ? new Date(finalAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Official Records - ${dsName}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 15mm; }
    body { font-family: "Times New Roman", Times, serif; color: #222; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { text-align: center; margin-bottom: 14px; }
    .header img { width: 50px; height: 50px; object-fit: contain; margin-bottom: 4px; }
    .header .ministry { font-weight: 700; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; }
    .header .division { font-weight: 600; font-size: 9pt; margin-top: 2px; }
    .divider { border-top: 2px solid #222; border-bottom: 1px solid #222; padding: 4px 0; margin-bottom: 12px; }
    .info-row { margin-bottom: 5px; font-size: 10pt; }
    .info-row strong { display: inline-block; min-width: 160px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1E3A5F; color: #fff; padding: 8px 9px; text-align: left; font-size: 10pt; }
    th.center { text-align: center; }
    td { padding: 7px 9px; border: 1px solid #bbb; font-size: 10pt; }
    td.center { text-align: center; }
    .signature-line { margin-top: 36px; margin-bottom: 8px; }
    .signature-line .dots { border-top: 1px dotted #222; width: 260px; margin-bottom: 6px; }
    .signature-line .label { font-size: 10pt; font-weight: 600; }
    .footer { margin-top: 20px; font-size: 9pt; color: #666; text-align: center; font-style: italic; }
    .watermark {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 999;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .watermark img { width: 80%; max-width: 600px; opacity: 0.1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      .watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .watermark img { opacity: 0.1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="watermark"><img src="${window.location.origin}/government-logo.jpg" alt="" /></div>

  <div class="header">
    <img src="${window.location.origin}/government-logo.jpg" alt="Government Logo" />
    <div class="ministry">Ministry of Public Administration, Home Affairs,<br />Provincial Councils &amp; Local Government</div>
    <div class="division">- Life Location Code Management System -</div>
  </div>
  <div class="divider"></div>

  <div class="info-row"><strong>Divisional Secretariat:</strong> ${dsName}</div>
  <div class="info-row"><strong>Finalized At:</strong> ${ft}</div>
  <div class="info-row"><strong>Document Type:</strong> <span style="color:#1e8449;font-weight:700">FINAL — Officially Confirmed Records</span></div>

  <table>
    <thead>
      <tr>
        <th>GN Division</th>
        <th class="center">GN Code</th>
        <th class="center">Lifecode</th>
        <th class="center">Villages</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="signature-line">
    <div class="dots"></div>
    <div class="label">Checked &amp; Signed By</div>
  </div>

  <div class="footer">This is a computer-generated final document. These records are officially confirmed.</div>
</body>
</html>`
}

const handlePrint = ({ dsName, finalAt, gns }) => {
  const win = window.open('', '_blank')
  win.document.write(renderHtml({ dsName, finalAt, gns }))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

export default function PrintOfficialRecordsModal({ dsName, finalAt, gns, show, onClose }) {
  if (!show || !gns || gns.length === 0) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:780,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'sticky',top:0,background:'#fff',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:1}}>
          <span style={{fontWeight:700,fontSize:14,color:'var(--primary)'}}>Official Records — {dsName}</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => handlePrint({ dsName, finalAt, gns })} style={{padding:'8px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>Print</button>
            <button onClick={onClose} style={{padding:'8px 18px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6,fontWeight:600,fontSize:13,cursor:'pointer'}}>Close</button>
          </div>
        </div>

        <div style={{padding:'28px 32px',fontFamily:'"Times New Roman", Times, serif',color:'#222',fontSize:12,lineHeight:1.5,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:0}}>
            <img src="/government-logo.jpg" alt="" style={{width:'80%',maxWidth:500,opacity:0.1}} />
          </div>

          <div style={{position:'relative',zIndex:1}}>
            <div style={{textAlign:'center',marginBottom:14}}>
              <img src="/government-logo.jpg" alt="Government Logo" style={{width:50,height:50,objectFit:'contain',marginBottom:4}} />
              <div style={{fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:0.5}}>
                Ministry of Public Administration, Home Affairs,<br />Provincial Councils &amp; Local Government
              </div>
              <div style={{fontWeight:600,fontSize:9,marginTop:2}}>- Life Location Code Management System -</div>
            </div>

            <div style={{borderTop:'2px solid #222',borderBottom:'1px solid #222',padding:'4px 0',marginBottom:12}} />

            <div style={{marginBottom:5,fontSize:10}}><strong style={{display:'inline-block',minWidth:160}}>Divisional Secretariat:</strong> {dsName}</div>
            <div style={{marginBottom:5,fontSize:10}}><strong style={{display:'inline-block',minWidth:160}}>Finalized At:</strong> {finalAt ? new Date(finalAt).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
            <div style={{marginBottom:5,fontSize:10}}>
              <strong style={{display:'inline-block',minWidth:160}}>Document Type:</strong>
              <span style={{color:'#1e8449',fontWeight:700}}>FINAL — Officially Confirmed Records</span>
            </div>

            <table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}>
              <thead>
                <tr>
                  <th style={{background:'#1E3A5F',color:'#fff',padding:'8px 9px',textAlign:'left',fontSize:10}}>GN Division</th>
                  <th style={{background:'#1E3A5F',color:'#fff',padding:'8px 9px',textAlign:'center',fontSize:10}}>GN Code</th>
                  <th style={{background:'#1E3A5F',color:'#fff',padding:'8px 9px',textAlign:'center',fontSize:10}}>Lifecode</th>
                  <th style={{background:'#1E3A5F',color:'#fff',padding:'8px 9px',textAlign:'center',fontSize:10}}>Villages</th>
                </tr>
              </thead>
              <tbody>
                {gns.map((gn, i) => (
                  <tr key={gn.id} style={{background: i % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                    <td style={{padding:'7px 9px',border:'1px solid #bbb',fontSize:10}}>{gn.name_english}</td>
                    <td style={{padding:'7px 9px',border:'1px solid #bbb',fontSize:10,textAlign:'center'}}>{gn.grama_niladhari_division_code || '—'}</td>
                    <td style={{padding:'7px 9px',border:'1px solid #bbb',fontSize:10,textAlign:'center'}}>{gn.lifecode || '—'}</td>
                    <td style={{padding:'7px 9px',border:'1px solid #bbb',fontSize:10,textAlign:'center'}}>{(gn.villages || []).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{marginTop:36,marginBottom:8}}>
              <div style={{borderTop:'1px dotted #222',width:260,marginBottom:6}} />
              <div style={{fontSize:10,fontWeight:600}}>Checked &amp; Signed By</div>
            </div>

            <div style={{marginTop:20,fontSize:9,color:'#666',textAlign:'center',fontStyle:'italic'}}>
              This is a computer-generated final document. These records are officially confirmed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
