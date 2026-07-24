import React, { useRef } from 'react'

const senderDetails = {
  name: 'Director - ICT',
  ministry: 'Ministry of Public Administration, Home Affairs, Provincial Councils & Local Government - Home Affairs Division',
  address: [
    '"Nila Madura"',
    'Elvitigala Mawatha, Narahenpita',
    'Colombo 05, Sri Lanka',
  ],
}

const renderLetterHtml = (target) => `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Official Letter - ${target.ds_name}</title>
    <style>
      @page { size: A4; margin: 20mm 15mm; }
      body { font-family: "Times New Roman", Times, serif; color: #222; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; }
      .print-wrapper { transform: scale(0.95); transform-origin: top left; width: 105.26%; }
      .letterhead { text-align: center; margin-bottom: 20px; }
      .letterhead img { width: 60px; height: 60px; object-fit: contain; margin-bottom: 6px; }
      .letterhead .ministry { font-weight: 700; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.5px; }
      .letterhead .division { font-weight: 600; font-size: 10pt; margin-top: 1px; }
      .divider { border-top: 2px solid #222; border-bottom: 1px solid #222; padding: 6px 0; margin-bottom: 18px; }
      .thin-divider { border-bottom: 1px solid #222; margin-bottom: 16px; }
      .section { margin-bottom: 14px; }
      .indent-48 { margin-left: 48px; }
      .indent-32 { margin-left: 32px; }
      .subject { text-decoration: underline; font-weight: 700; font-size: 13pt; margin-bottom: 16px; text-align: center; }
      .body-text { margin-bottom: 16px; }
      .body-text p { margin-bottom: 8px; text-indent: 24px; }
      .closing { margin-top: 18px; }
      .signature { margin-top: 28px; }
      .signature .line { border-top: 1px dotted #222; width: 200px; margin-bottom: 6px; }
      .signature .name { font-weight: 700; }
      .signature .title { font-size: 11pt; }
    </style>
  </head>
  <body>
    <div class="print-wrapper">
      <div class="letterhead">
        <img src="${window.location.origin}/government-logo.jpg" alt="Government Logo" />
        <div class="ministry">Ministry of Public Administration, Home Affairs,<br />Provincial Councils &amp; Local Government</div>
        <div class="division">- Home Affairs Division -</div>
      </div>
      <div class="divider"></div>
      <div class="section">
        <div><strong>From:</strong> ${senderDetails.name}</div>
        <div class="indent-48">${senderDetails.ministry}</div>
        ${senderDetails.address.map(line => `<div class="indent-48">${line}</div>`).join('')}
      </div>
      <div class="section">
        <div><strong>To:</strong></div>
        <div class="indent-32">The Divisional Secretary</div>
        <div class="indent-32">${target.ds_name} Divisional Secretariat</div>
        <div class="indent-32">${target.district_name} District</div>
        <div class="indent-32">${target.province_name} Province</div>
      </div>
      <div class="section">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div class="thin-divider"></div>
      <div class="subject">Regarding the confirmation about the Grama Niladhari divisions under your administration</div>
      <div class="body-text">
        <p>Dear Sir/Madam,</p>
        <p>This is to bring to your attention that the Grama Niladhari divisions under your administration at the <strong>${target.ds_name} Divisional Secretariat</strong> have not yet been confirmed in the Life Location Code Management System.</p>
        <p>As per the instructions of the Ministry, all Divisional Secretaries are required to verify and confirm the Grama Niladhari divisions and villages under their purview at the earliest opportunity.</p>
        <p>Therefore, you are kindly requested to log in to the system and complete the confirmation process for all pending GN divisions under your administration without further delay.</p>
        <p>Your prompt action in this regard is highly appreciated.</p>
      </div>
      <div class="closing">
        <p>Thanking you,</p>
        <div class="signature">
          <div class="line"></div>
          <div class="name">${senderDetails.name}</div>
          <div class="title">${senderDetails.ministry}</div>
        </div>
      </div>
    </div>
  </body>
  </html>
`

const handlePrint = (target) => {
  const win = window.open('', '_blank')
  win.document.write(renderLetterHtml(target))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

export default function PrintLetterModal({ target, onClose }) {
  const printRef = useRef(null)

  if (!target) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:820,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'sticky',top:0,background:'#fff',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:1}}>
          <span style={{fontWeight:700,fontSize:14,color:'var(--primary)'}}>Print Preview - {target.ds_name}</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => handlePrint(target)} style={{padding:'8px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>Print</button>
            <button onClick={onClose} style={{padding:'8px 18px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6,fontWeight:600,fontSize:13,cursor:'pointer'}}>Close</button>
          </div>
        </div>

        <div ref={printRef} style={{padding:'35px 40px',fontFamily:'"Times New Roman", Times, serif',color:'#222',fontSize:12,lineHeight:1.5}}>
          <div style={{textAlign:'center',marginBottom:20}}>
            <img src="/government-logo.jpg" alt="Government Logo" style={{width:60,height:60,objectFit:'contain',marginBottom:6}} />
            <div style={{fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:0.5}}>
              Ministry of Public Administration, Home Affairs,<br />
              Provincial Councils &amp; Local Government
            </div>
            <div style={{fontWeight:600,fontSize:10,marginTop:1}}>- Home Affairs Division -</div>
          </div>

          <div style={{borderTop:'2px solid #222',borderBottom:'1px solid #222',padding:'6px 0',marginBottom:18}} />

          <div style={{marginBottom:14}}>
            <div><strong>From:</strong> {senderDetails.name}</div>
            <div style={{marginLeft:48}}>{senderDetails.ministry}</div>
            {senderDetails.address.map((line,i) => (
              <div key={i} style={{marginLeft:48}}>{line}</div>
            ))}
          </div>

          <div style={{marginBottom:14}}>
            <div><strong>To:</strong></div>
            <div style={{marginLeft:32}}>The Divisional Secretary</div>
            <div style={{marginLeft:32}}>{target.ds_name} Divisional Secretariat</div>
            <div style={{marginLeft:32}}>{target.district_name} District</div>
            <div style={{marginLeft:32}}>{target.province_name} Province</div>
          </div>

          <div style={{marginBottom:14}}>
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>
          </div>

          <div style={{borderBottom:'1px solid #222',marginBottom:16}} />

          <div style={{textDecoration:'underline',fontWeight:700,fontSize:13,marginBottom:16,textAlign:'center'}}>
            Regarding the confirmation about the Grama Niladhari divisions under your administration
          </div>

          <div style={{marginBottom:16}}>
            <p style={{marginBottom:8}}>Dear Sir/Madam,</p>
            <p style={{marginBottom:8,textIndent:24}}>
              This is to bring to your attention that the Grama Niladhari divisions under your administration at the{' '}
              <strong>{target.ds_name} Divisional Secretariat</strong> have not yet been confirmed in the
              Life Location Code Management System.
            </p>
            <p style={{marginBottom:8,textIndent:24}}>
              As per the instructions of the Ministry, all Divisional Secretaries are required to verify and confirm
              the Grama Niladhari divisions and villages under their purview at the earliest opportunity.
            </p>
            <p style={{marginBottom:8,textIndent:24}}>
              Therefore, you are kindly requested to log in to the system and complete the confirmation process
              for all pending GN divisions under your administration without further delay.
            </p>
            <p style={{marginBottom:8,textIndent:24}}>
              Your prompt action in this regard is highly appreciated.
            </p>
          </div>

          <div style={{marginTop:18}}>
            <p>Thanking you,</p>
            <div style={{marginTop:28}}>
              <div style={{borderTop:'1px dotted #222',width:200,marginBottom:6}} />
              <div style={{fontWeight:700}}>{senderDetails.name}</div>
              <div style={{fontSize:11}}>{senderDetails.ministry}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
