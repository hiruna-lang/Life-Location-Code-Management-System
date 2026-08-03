import React, { useRef } from 'react'
import { renderLetterHeader, letterHeaderStyles } from '../utils/letterHeader'
import { getLetterText } from '../utils/letterTranslations'

const getLocalizedName = (target, lang, baseKey) => {
  const suffix = lang === 'si' ? 'sinhala' : lang === 'ta' ? 'tamil' : 'english'
  return target?.[`${baseKey}_${suffix}`] || target?.[baseKey] || ''
}

const renderLetterHtml = (target, lang, origin) => {
  const dsName = getLocalizedName(target, lang, 'ds_name')
  const dsNameEnglish = target?.ds_name || ''
  const districtName = target?.district_name || ''
  const provinceName = target?.province_name || ''
  const text = getLetterText(lang, dsName)
  const headerHtml = renderLetterHeader(origin, lang)
  const headerCss = letterHeaderStyles(lang)
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const isTamil = lang === 'ta'

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Official Letter - ${dsNameEnglish}</title>
    <style>
      @page { size: A4; margin: 20mm 15mm; }
      body { font-family: "Times New Roman", Times, serif; color: #222; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; }
      .print-wrapper { transform: scale(0.95); transform-origin: top left; width: 105.26%; }
      .print-wrapper--tamil { font-size: 10.5pt; line-height: 1.4; }
      .print-wrapper--tamil .recipient,
      .print-wrapper--tamil .letter-date,
      .print-wrapper--tamil .body-text,
      .print-wrapper--tamil .closing { font-size: 10.5pt; }
      .print-wrapper--tamil .subject { font-size: 11.5pt; }
      .print-wrapper--tamil .signature .title { font-size: 10pt; }
      ${headerCss}
      .recipient { margin-bottom: 14px; font-size: 12pt; line-height: 1.6; }
      .body-ds-name { font-weight: 700; }
      .letter-date { margin-bottom: 14px; font-size: 12pt; }
      .body-divider { border-bottom: 1px solid #222; margin-bottom: 16px; }
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
    <div class="print-wrapper${isTamil ? ' print-wrapper--tamil' : ''}">
      ${headerHtml}

      <div class="recipient">
        <div>The Divisional Secretary</div>
        <div>${dsNameEnglish} Divisional Secretariat</div>
        <div>${districtName} District</div>
        <div>${provinceName} Province</div>
      </div>

      <div class="letter-date">${dateStr}</div>

      <div class="body-divider"></div>

      <div class="subject">${text.subject}</div>

      <div class="body-text">
        <p>${text.greeting}</p>
        ${text.paragraphs.map((p, index) => `<p>${index === 0 && dsName ? p.replace(dsName, `<strong class="body-ds-name">${dsName}</strong>`) : p}</p>`).join('')}
      </div>

      <div class="closing">
        <p>${text.closing}</p>
        <div class="signature">
          <div class="line"></div>
          <div class="name">${text.senderName}</div>
          <div class="title">${text.senderMinistry}</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

const handlePrint = (target, lang) => {
  const win = window.open('', '_blank')
  win.document.write(renderLetterHtml(target, lang, window.location.origin))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

export default function PrintLetterModal({ target, language, onClose }) {
  const printRef = useRef(null)

  if (!target || !language) return null

  const dsName = getLocalizedName(target, language, 'ds_name')
  const dsNameEnglish = target?.ds_name || ''
  const districtName = target?.district_name || ''
  const provinceName = target?.province_name || ''
  const text = getLetterText(language, dsName)
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const isTamil = language === 'ta'

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:820,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'sticky',top:0,background:'#fff',borderBottom:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:1}}>
          <span style={{fontWeight:700,fontSize:14,color:'var(--primary)'}}>Print Preview - {dsNameEnglish}</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => handlePrint(target, language)} style={{padding:'8px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>Print</button>
            <button onClick={onClose} style={{padding:'8px 18px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6,fontWeight:600,fontSize:13,cursor:'pointer'}}>Close</button>
          </div>
        </div>

        <div ref={printRef} style={{padding:'35px 40px',fontFamily:'"Times New Roman", Times, serif',color:'#222',fontSize:isTamil ? 11 : 12,lineHeight:isTamil ? 1.4 : 1.5}}>
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
              <img src="/government-logo.jpg" alt="Government Emblem" style={{width:60,height:60,objectFit:'contain',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontSize:isTamil ? 9 : 10,lineHeight:1.4}}>රාජ්‍ය පරිපාලන, පළාත් සභා සහ පළාත් පාලන අමාත්‍යාංශය</div>
                <div style={{fontSize:isTamil ? 9 : 10,lineHeight:1.4}}>பொது நிர்வாகம், மாகாண சபைகள் மற்றும் உள்ளாட்சி அமைச்சகம்</div>
                <div style={{fontWeight:700,fontSize:isTamil ? 10 : 11,lineHeight:1.4,marginTop:2}}>Ministry of Public Administration, Provincial Councils and Local Government</div>
              </div>
            </div>

            <div style={{borderTop:'2px solid #222',borderBottom:'1px solid #222',padding:'5px 0',marginBottom:10}} />

            <div style={{display:'flex',justifyContent:'space-between',gap:12,fontSize:isTamil ? 8.5 : 9,lineHeight:1.5}}>
              <div style={{flex:1}}>
                <div>ස්වදේශ කටයුතු අංශය</div>
                <div>உள்துறை பிரிவு</div>
                <div style={{fontWeight:600,marginTop:1}}>Home Affairs Division</div>
              </div>
              <div style={{flex:1,textAlign:'center'}}>
                <div>"නිල මැදුර", ඇල්විටිගල මාවත, කොළඹ 05.</div>
                <div>"நில மெதுர", எல்விடிகல மாவத்தை, கொழும் 05,</div>
                <div style={{fontWeight:600,marginTop:1}}>"Nila Madura", Elvitigala Mawatha, Colombo 05.</div>
              </div>
              <div style={{flex:'0 0 auto',minWidth:180,textAlign:'right'}}>
                <div>TP: +94 112 050 450</div>
                <div>Fax: +94 112 369 971</div>
                <div>Email: Info@moha.gov.lk</div>
                <div>Web: www.moha.gov.lk</div>
              </div>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <div>The Divisional Secretary</div>
            <div>{dsNameEnglish} Divisional Secretariat</div>
            <div>{districtName} District</div>
            <div>{provinceName} Province</div>
          </div>

          <div style={{marginBottom:14,fontSize:isTamil ? 11 : 12}}>{dateStr}</div>

          <div style={{borderBottom:'1px solid #222',marginBottom:16}} />

          <div style={{textDecoration:'underline',fontWeight:700,fontSize:isTamil ? 11.5 : 13,marginBottom:16,textAlign:'center'}}>
            {text.subject}
          </div>

          <div style={{marginBottom:16}}>
            <p style={{marginBottom:8,fontSize:isTamil ? 11 : 12}}>{text.greeting}</p>
            {text.paragraphs.map((p, i) => {
              const bodyText = i === 0 && dsName ? p.replace(dsName, `<strong>${dsName}</strong>`) : p
              return <p key={i} style={{marginBottom:8,textIndent:24,fontSize:isTamil ? 11 : 12}} dangerouslySetInnerHTML={{ __html: bodyText }} />
            })}
          </div>

          <div style={{marginTop:18}}>
            <p style={{fontSize:isTamil ? 11 : 12}}>{text.closing}</p>
            <div style={{marginTop:28}}>
              <div style={{borderTop:'1px dotted #222',width:200,marginBottom:6}} />
              <div style={{fontWeight:700,fontSize:isTamil ? 11 : 12}}>{text.senderName}</div>
              <div style={{fontSize:isTamil ? 10 : 11}}>{text.senderMinistry}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
