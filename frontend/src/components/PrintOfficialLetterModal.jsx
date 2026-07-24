import React from 'react'

const directorAddress = [
  'Director - ICT',
  'Ministry of Public Administration, Home Affairs,',
  'Provincial Councils & Local Government - Home Affairs Division',
  '"Nila Madura"',
  'Elvitigala Mawatha, Narahenpita',
  'Colombo 05, Sri Lanka',
]

const renderHtml = ({ dsName, finalAt }) => {
  const ft = finalAt
    ? new Date(finalAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Official Letter - ${dsName}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm 15mm; }
    body { font-family: "Times New Roman", Times, serif; color: #222; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; }
    .letterhead { text-align: center; margin-bottom: 20px; }
    .letterhead img { width: 60px; height: 60px; object-fit: contain; margin-bottom: 6px; }
    .letterhead .ministry { font-weight: 700; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px; }
    .letterhead .division { font-weight: 600; font-size: 10pt; margin-top: 1px; }
    .divider { border-top: 2px solid #222; border-bottom: 1px solid #222; padding: 6px 0; margin-bottom: 18px; }
    .thin-divider { border-bottom: 1px solid #222; margin-bottom: 16px; }
    .section { margin-bottom: 14px; }
    .indent-48 { margin-left: 48px; }
    .subject { text-decoration: underline; font-weight: 700; font-size: 13pt; margin-bottom: 16px; text-align: center; }
    .body-text { margin-bottom: 16px; }
    .body-text p { margin-bottom: 8px; text-indent: 24px; }
    .closing { margin-top: 18px; }
    .signature { margin-top: 28px; }
    .signature .line { border-top: 1px dotted #222; width: 240px; margin-bottom: 6px; }
    .signature .name { font-weight: 700; }
    .signature .title { font-size: 11pt; }
  </style>
</head>
<body>
  <div class="letterhead">
    <img src="${window.location.origin}/government-logo.jpg" alt="Government Logo" />
    <div class="ministry">${dsName} Divisional Secretariat</div>
    <div class="division">- Life Location Code Management System -</div>
  </div>
  <div class="divider"></div>
  <div class="section">
    <div><strong>From:</strong> The Divisional Secretary</div>
    <div class="indent-48">${dsName} Divisional Secretariat</div>
  </div>
  <div class="section">
    <div><strong>To:</strong> ${directorAddress[0]}</div>
    ${directorAddress.slice(1).map(line => `<div class="indent-48">${line}</div>`).join('')}
  </div>
  <div class="section">
    <div><strong>Date:</strong> ${ft}</div>
  </div>
  <div class="thin-divider"></div>
  <div class="subject">Confirmation of Grama Niladhari Division Records</div>
  <div class="body-text">
    <p>Dear Sir,</p>
    <p>This is to formally confirm that I, as the Divisional Secretary of the <strong>${dsName} Divisional Secretariat</strong>, have thoroughly reviewed and verified all Grama Niladhari divisions and villages under my purview in the Life Location Code Management System.</p>
    <p>All GN division details, including names, codes, lifecodes, and associated villages, have been checked and confirmed as accurate and complete. The records have been finalized and locked in the system as of ${ft}.</p>
    <p>This confirmation is submitted in accordance with the instructions of the Ministry of Public Administration, Home Affairs, Provincial Councils &amp; Local Government.</p>
  </div>
  <div class="closing">
    <p>Thanking you,</p>
    <div class="signature">
      <div class="line"></div>
      <div class="name">Divisional Secretary</div>
      <div class="title">${dsName} Divisional Secretariat</div>
    </div>
  </div>
</body>
</html>`
}

const handlePrint = ({ dsName, finalAt }) => {
  const win = window.open('', '_blank')
  win.document.write(renderHtml({ dsName, finalAt }))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

export default function PrintOfficialLetterModal({ dsName, finalAt, show, onClose }) {
  if (!show) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:780,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'sticky',top:0,background:'#fff',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:1}}>
          <span style={{fontWeight:700,fontSize:14,color:'var(--primary)'}}>Official Letter — {dsName}</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => handlePrint({ dsName, finalAt })} style={{padding:'8px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>Print</button>
            <button onClick={onClose} style={{padding:'8px 18px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6,fontWeight:600,fontSize:13,cursor:'pointer'}}>Close</button>
          </div>
        </div>

        <div style={{padding:'30px 35px',fontFamily:'"Times New Roman", Times, serif',color:'#222',fontSize:12,lineHeight:1.5}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <img src="/government-logo.jpg" alt="Government Logo" style={{width:60,height:60,objectFit:'contain',marginBottom:6}} />
            <div style={{fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:0.5}}>
              {dsName} Divisional Secretariat
            </div>
            <div style={{fontWeight:600,fontSize:10,marginTop:1}}>- Life Location Code Management System -</div>
          </div>

          <div style={{borderTop:'2px solid #222',borderBottom:'1px solid #222',padding:'6px 0',marginBottom:18}} />

          <div style={{marginBottom:14}}>
            <div><strong>From:</strong> The Divisional Secretary</div>
            <div style={{marginLeft:48}}>{dsName} Divisional Secretariat</div>
          </div>

          <div style={{marginBottom:14}}>
            <div><strong>To:</strong> {directorAddress[0]}</div>
            {directorAddress.slice(1).map((line, i) => (
              <div key={i} style={{marginLeft:48}}>{line}</div>
            ))}
          </div>

          <div style={{marginBottom:14}}>
            <div><strong>Date:</strong> {finalAt ? new Date(finalAt).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>
          </div>

          <div style={{borderBottom:'1px solid #222',marginBottom:16}} />

          <div style={{textDecoration:'underline',fontWeight:700,fontSize:13,marginBottom:16,textAlign:'center'}}>
            Confirmation of Grama Niladhari Division Records
          </div>

          <div style={{marginBottom:16}}>
            <p style={{marginBottom:8}}>Dear Sir,</p>
            <p style={{marginBottom:8,textIndent:24}}>
              This is to formally confirm that I, as the Divisional Secretary of the{' '}
              <strong>{dsName} Divisional Secretariat</strong>, have thoroughly reviewed and verified
              all Grama Niladhari divisions and villages under my purview in the Life Location Code Management System.
            </p>
            <p style={{marginBottom:8,textIndent:24}}>
              All GN division details, including names, codes, lifecodes, and associated villages, have been checked
              and confirmed as accurate and complete. The records have been finalized and locked in the system
              as of {finalAt ? new Date(finalAt).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'the date of this letter'}.
            </p>
            <p style={{marginBottom:8,textIndent:24}}>
              This confirmation is submitted in accordance with the instructions of the Ministry of Public Administration,
              Home Affairs, Provincial Councils &amp; Local Government.
            </p>
          </div>

          <div style={{marginTop:18}}>
            <p>Thanking you,</p>
            <div style={{marginTop:28}}>
              <div style={{borderTop:'1px dotted #222',width:240,marginBottom:6}} />
              <div style={{fontWeight:700}}>Divisional Secretary</div>
              <div style={{fontSize:11}}>{dsName} Divisional Secretariat</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
