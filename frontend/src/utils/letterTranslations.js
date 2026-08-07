const letterTranslations = {
  en: {
    subject: 'Regarding the confirmation about the Grama Niladhari divisions under your administration',
    greeting: 'Dear Sir/Madam,',
    p1: (ds) => `This is to bring to your attention that the Grama Niladhari divisions under your administration at the ${ds} Divisional Secretariat have not yet been confirmed in the Life Location Code Management System.`,
    p2: 'As per the instructions of the Ministry, all Divisional Secretaries are required to verify and confirm the Grama Niladhari divisions and villages under their purview at the earliest opportunity.',
    p3: 'Therefore, you are kindly requested to log in to the system and complete the confirmation process for all pending GN divisions under your administration without further delay.',
    p4: 'Your prompt action in this regard is highly appreciated.',
    closing: 'Thanking you,',
    senderName: 'Director - ICT',
    senderMinistry: 'Ministry of Public Administration, Provincial Councils & Local Government - Home Affairs Division',
  },
  si: {
    subject: 'ඔබගේ පරිපාලනය යටතේ ඇති ග්‍රාම නිලධාරී කොට්ඨාශ පිළිබඳ තහවුරු කිරීම සම්බන්ධයෙන්',
    greeting: 'මහත්මයාණෙනි/මහත්මියණි,',
    p1: (ds) => `${ds} ප්‍රාදේශීය ලේකම් කාර්යාලයේ ඔබගේ පරිපාලනය යටතේ ඇති ග්‍රාම නිලධාරී කොට්ඨාශ තවමත් ලයිෆ් ස්ථාන කේත කළමනාකරණ පද්ධතිය තුළ තහවුරු කර නොමැති බව ඔබගේ අවධානයට යොමු කිරීමටයි.`,
    p2: '	අමාත්‍යාංශයේ උපදෙස් පරිදි, සියලුම ප්‍රාදේශීය ලේකම්වරුන් හැකි ඉක්මනින් තම බල ප්‍රදේශය යටතේ ඇති ග්‍රාම නිලධාරී වසම් සහ ගම්මාන සත්‍යාපනය කර තහවුරු කළ යුතුය.',
    p3: 'එබැවින්, පද්ධතියට ලොග් වී ඔබගේ පරිපාලනය යටතේ ඇති සියලුම අපේක්ෂිත ග්‍රාම නිලධාරී කොට්ඨාශ සඳහා තහවුරු කිරීමේ ක්‍රියාවලිය තවදුරටත් ප්‍රමාදයකින් තොරව සම්පූර්ණ කරන ලෙස ඔබෙන් කාරුණිකව ඉල්ලා සිටිමු.',
    p4: 'මේ සම්බන්ධයෙන් ඔබගේ කඩිනම් ක්‍රියාමාර්ගය බෙහෙවින් අගය කරනු ලැබේ.',
    closing: 'ස්තූතියි,',
    senderName: 'අධ්‍යක්ෂ - තොරතුරු හා සන්නිවේදන තාක්ෂණ',
    senderMinistry: 'රාජ්‍ය පරිපාලන, පළාත් සභා සහ පළාත් පාලන අමාත්‍යාංශය - ස්වදේශ කටයුතු අංශය.',
  },
  ta: {
    subject: 'உங்கள் நிர்வாகத்தின் கீழ் கிராம அலுவலர் பிரிவுகளை உறுதிப்படுத்துவது தொடர்பாக',
    greeting: 'அன்புள்ள ஐயா/அம்மையீர்,',
    p1: (ds) => `${ds} கோட்டச் செயலகத்தில் உங்கள் நிர்வாகத்தின் கீழ் உள்ள கிராம அலுவலர் கோட்டங்கள், உயிரியல் தளக் குறியீட்டு மேலாண்மை அமைப்பில் இன்னும் சரிபார்க்கப்படவில்லை என்ற உண்மையை உங்கள் கவனத்திற்குக் கொண்டுவர விரும்புகிறோம்.`,
    p2: 'அமைச்சகத்தின் அறிவுறுத்தல்களின்படி, அனைத்து பிரதேச செயலாளர்களும் தங்கள் அதிகார வரம்பிற்குட்பட்ட கிராம அலுவலர் கோட்டங்களையும் கிராமங்களையும் கூடிய விரைவில் சரிபார்த்து உறுதிப்படுத்த வேண்டும்.',
    p3: 'எனவே, உங்கள் நிர்வாகத்தின் கீழ் உள்ள, நீங்கள் விரும்பும் அனைத்து கிராம அலுவலர் பிரிவுகளுக்குமான சரிபார்ப்பு செயல்முறையை, மேலும் தாமதமின்றி கணினி அமைப்பில் உள்நுழைந்து நிறைவு செய்யுமாறு உங்களை அன்புடன் கேட்டுக்கொள்கிறோம்.',
    p4: 'இது தொடர்பாக நீங்கள் எடுத்த உடனடி நடவடிக்கை பெரிதும் பாராட்டப்படுகிறது.',
    closing: 'நன்றி,',
    senderName: 'இயக்குநர் - தகவல் மற்றும் தொடர்பு தொழில்நுட்பம்',
    senderMinistry: 'பொது நிர்வாகம், மாகாண சபைகள் மற்றும் உள்ளூராட்சி அமைச்சு - உள்துறைப் பிரிவு.',
  },
}

export function getLetterText(lang, dsName) {
  const t = letterTranslations[lang] || letterTranslations.en
  return {
    subject: t.subject,
    greeting: t.greeting,
    paragraphs: [
      typeof t.p1 === 'function' ? t.p1(dsName) : t.p1,
      t.p2,
      t.p3,
      t.p4,
    ],
    closing: t.closing,
    senderName: t.senderName,
    senderMinistry: t.senderMinistry,
  }
}

export default letterTranslations
