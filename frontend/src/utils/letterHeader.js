const headerData = {
  ministry: {
    sinhala: 'රාජ්\u200Dය පරිපාලන, පළාත් සභා සහ පළාත් පාලන අමාත්\u200Dයාංශය',
    tamil: 'பொது நிர்வாகம், மாகாண சபைகள் மற்றும் உள்ளாட்சி அமைச்சகம்',
    english: 'Ministry of Public Administration, Provincial Councils and Local Government',
  },
  division: {
    sinhala: 'ස්වදේශ කටයුතු අංශය',
    tamil: 'உள்துறை பிரிவு',
    english: 'Home Affairs Division',
  },
  address: {
    sinhala: '"නිල මැදුර", ඇල්විටිගල මාවත, කොළඹ 05.',
    tamil: '"நில மெதுர", எல்விடிகல மாவத்தை, கொழும் 05,',
    english: '"Nila Madura", Elvitigala Mawatha, Colombo 05.',
  },
  contact: {
    phone: '+94 112 050 450',
    fax: '+94 112 369 971',
    email: 'Info@moha.gov.lk',
    web: 'www.moha.gov.lk',
  },
}

export function renderLetterHeader(origin) {
  const logoUrl = `${origin}/government-logo.jpg`
  const { ministry, division, address, contact } = headerData

  return `
    <div class="letter-header">
      <div class="letter-header__top">
        <img src="${logoUrl}" alt="Government Emblem" class="letter-header__emblem" />
        <div class="letter-header__ministry">
          <div class="letter-header__ministry-line">${ministry.sinhala}</div>
          <div class="letter-header__ministry-line">${ministry.tamil}</div>
          <div class="letter-header__ministry-line letter-header__ministry-line--english">${ministry.english}</div>
        </div>
      </div>
      <div class="letter-header__divider"></div>
      <div class="letter-header__bottom">
        <div class="letter-header__col">
          <div>${division.sinhala}</div>
          <div>${division.tamil}</div>
          <div class="letter-header__col--english">${division.english}</div>
        </div>
        <div class="letter-header__col letter-header__col--center">
          <div>${address.sinhala}</div>
          <div>${address.tamil}</div>
          <div class="letter-header__col--english">${address.english}</div>
        </div>
        <div class="letter-header__col letter-header__col--right">
          <div>TP: ${contact.phone}</div>
          <div>Fax: ${contact.fax}</div>
          <div>Email: ${contact.email}</div>
          <div>Web: ${contact.web}</div>
        </div>
      </div>
    </div>
  `
}

export function letterHeaderStyles() {
  return `
    .letter-header { margin-bottom: 16px; }
    .letter-header__top { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
    .letter-header__emblem { width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; }
    .letter-header__ministry { flex: 1; }
    .letter-header__ministry-line { font-size: 10pt; line-height: 1.4; }
    .letter-header__ministry-line--english { font-weight: 700; font-size: 11pt; margin-top: 2px; }
    .letter-header__divider { border-top: 2px solid #222; border-bottom: 1px solid #222; padding: 5px 0; margin-bottom: 10px; }
    .letter-header__bottom { display: flex; justify-content: space-between; gap: 12px; font-size: 9pt; line-height: 1.5; }
    .letter-header__col { flex: 1; }
    .letter-header__col--center { text-align: center; }
    .letter-header__col--right { text-align: right; flex: 0 0 auto; min-width: 180px; }
    .letter-header__col--english { font-weight: 600; margin-top: 1px; }
  `
}

export default headerData
