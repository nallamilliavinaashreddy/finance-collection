/**
 * Pan-India Multilingual Lexicon for FinCollect AI
 * Supports 22 Scheduled Indian Languages + English + Transliterations
 */

export type SupportedLanguageCode =
  | 'auto'
  | 'en'   // English
  | 'te'   // Telugu
  | 'hi'   // Hindi
  | 'ta'   // Tamil
  | 'kn'   // Kannada
  | 'ml'   // Malayalam
  | 'mr'   // Marathi
  | 'bn'   // Bengali
  | 'gu'   // Gujarati
  | 'pa'   // Punjabi
  | 'or'   // Odia
  | 'as'   // Assamese
  | 'ur'   // Urdu
  | 'ne'   // Nepali
  | 'gom'  // Konkani
  | 'mni'  // Manipuri
  | 'brx'  // Bodo
  | 'doi'  // Dogri
  | 'mai'  // Maithili
  | 'sa'   // Sanskrit
  | 'ks'   // Kashmiri
  | 'sd'   // Sindhi
  | 'sat'; // Santhali

export interface LanguageMeta {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  scriptRange?: RegExp;
}

export const ALL_SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'AUTO (ఆటో / ऑटो / தானியங்கு)', flag: '🌐' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', scriptRange: /[\u0C00-\u0C7F]/ },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', scriptRange: /[\u0B80-\u0BFF]/ },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', scriptRange: /[\u0C80-\u0CFF]/ },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', scriptRange: /[\u0D00-\u0D7F]/ },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', scriptRange: /[\u0980-\u09FF]/ },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', scriptRange: /[\u0A80-\u0AFF]/ },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', scriptRange: /[\u0A00-\u0A7F]/ },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', scriptRange: /[\u0B00-\u0B7F]/ },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', scriptRange: /[\u0980-\u09FF]/ },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', scriptRange: /[\u0600-\u06FF]/ },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', scriptRange: /[\u0900-\u097F]/ },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', flag: '🇮🇳', scriptRange: /[\u0980-\u09FF\uABC0-\uABFF]/ },
  { code: 'brx', name: 'Bodo', nativeName: 'बोडो', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳', scriptRange: /[\u0900-\u097F]/ },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कश्मीरी / کٲشُر', flag: '🇮🇳', scriptRange: /[\u0600-\u06FF\u0900-\u097F]/ },
  { code: 'sd', name: 'Sindhi', nativeName: 'सिन्धी / سنڌي', flag: '🇮🇳', scriptRange: /[\u0600-\u06FF\u0900-\u097F]/ },
  { code: 'sat', name: 'Santhali', nativeName: 'ᱥᱟ process', flag: '🇮🇳', scriptRange: /[\u1C50-\u1C7F\u0980-\u09FF]/ },
];

/**
 * Normalized Financial Intents across all languages
 */
export type FinancialIntent =
  | 'SECURITY_MUTATION_CHECK'
  | 'GREETING'
  | 'THANKS'
  | 'HELP'
  | 'BYE'
  | 'CUSTOMER_COUNT'
  | 'CUSTOMER_LOOKUP'
  | 'TODAY_COLLECTION'
  | 'WEEKLY_COLLECTION'
  | 'MONTHLY_COLLECTION'
  | 'DAY_BOOK_BALANCES'
  | 'CASH_IN_HAND'
  | 'ACTIVE_LOANS'
  | 'SETTLED_LOANS'
  | 'INTEREST_INCOME'
  | 'EXPENSES_SUMMARY'
  | 'FINANCIAL_STATEMENTS'
  | 'UNKNOWN';

/**
 * Financial Term Lexicon mapped to language codes and transliterations
 */
export const FINANCIAL_LEXICON = {
  collection: [
    'collection', 'collections', 'vasool', 'vasoolu', 'vasuli', 'vasooliya',
    'వసూలు', 'కలెక్షన్', 'కలెక్షన్లు', 'కలెక్ట్',
    'कलेक्शन', 'वसूल', 'वसूली', 'संग्रह',
    'வசூல்', 'கலெக்ஷன்',
    'ಸಂಗ್ರಹ', 'ಕಲೆಕ್ಷನ್', 'ವಸೂಲಿ',
    'ശേഖരണം', 'പിരിവ്',
    'कलेक्शन', 'वसुली',
    'কালেকশন', 'আদায়', 'সংগ্রহ',
    'કલેક્શન', 'વસૂલી',
    'ਕੁਲੈਕਸ਼ਨ', 'ਉਗਰਾਹੀ',
    'ସଂଗ୍ରହ', 'ଆଦାୟ',
    'কালেকশ্যন',
    'کلیکشن', 'وصولی',
    'कलेक्सन', 'उठानी',
    'कलेक्शन', 'वसूल',
    'कलेक्सन', 'वसूल',
    'कलेक्शन', 'वसूल',
    'कलेक्शन', 'वसूली',
    'सङ्ग्रहः', 'सङ्ग्रह',
    'वसूल', 'کَلیَکشَن',
    'उगराही', 'کولیکشن',
    'ᱚᱨᱡᱚ', 'ᱠᱚᱞᱮᱠᱥᱚᱱ'
  ],

  customer: [
    'customer', 'customers', 'client', 'clients', 'borrower', 'borrowers',
    'khata', 'khatadar', 'khatadarlar', 'assalu',
    'వినియోగదారులు', 'కస్టమర్లు', 'ఖాతాదారులు', 'రైతులు', 'ఖాతా',
    'ग्राहक', 'ग्राहकों', 'खाताधारक', 'कस्टमर', 'कस्टमर्स',
    'வாடிக்கையாளர்', 'வாடிக்கையாளர்கள்',
    'গ্রাহক', 'গ্রাহকগণ',
    'ગ્રાહક', 'ગ્રાહકો',
    'ਗ੍ਰਾਹਕ', 'ਗਾਹਕ',
    'ଗ୍ରାହକ',
    'گاہک', 'گاہکین',
    'ग्राहकहरू',
    'ग्राहक',
    'ग्राहक',
    'ग्राहक',
    'ग्राहक',
    'ग्राहकाः', 'ग्राहक',
    'گَراہَکھ',
    'ग्राहक',
    'ᱜᱽᱨᱟᱦᱟᱠ'
  ],

  loan: [
    'loan', 'loans', 'appu', 'appulu', 'rinam', 'rinamu', 'udhar', 'udhri',
    'అప్పు', 'అప్పులు', 'రుణం', 'రుణాలు', 'లోన్', 'లోన్లు',
    'ऋण', 'लोन', 'कर्ज', 'उधार',
    'கடன்', 'கடன்கள்', 'லோன்',
    'ಸಾಲ', 'ಸಾಲಗಳು', 'ಲೋನ್',
    'വായ്പ', 'കടം',
    'कर्ज', 'लोन',
    'ঋণ', 'লোন',
    'ધીરણ', 'લોન', 'કરજ',
    'ਕਰਜ਼ਾ', 'ਲੋਨ',
    'ঋଣ', 'ଲୋନ୍',
    'قرض', 'قرضے', 'لون',
    'ऋण', 'ऋणहरू',
    'कर्ज',
    'ঋণ',
    'कर्ज',
    'कर्ज',
    'कर्ज',
    'ऋणम्', 'ऋणानि',
    'قَرض',
    'कर्ज',
    'ᱨᱤᱬ'
  ],

  today: [
    'today', 'ivala', 'eeroju', 'ee roju', 'iyala', 'aaj', 'aajka', 'aajki',
    'inru', 'inniki', 'ivattu', 'indhu', 'innu', 'aajche', 'aajker', 'aajnu',
    'ajj', 'aaji', 'aaji', 'aaj', 'aaj', 'aaj', 'aaj', 'aaj', 'adya', 'az', 'aaj', 'tehen',
    'ఈ రోజు', 'ఇవాళ', 'ఈరోజు', 'ఈవేళ',
    'आज', 'आज का', 'आज की',
    'இன்று', 'இன்னைக்கு',
    'ಇವತ್ತು', 'ಇಂದು',
    'இன்று', 'இன்றைக்கு',
    'आज', 'आजचे',
    'আজ', 'আজকের',
    'આજ', 'આજનું',
    'ਅੱਜ', 'ਅੱਜ ਦੀ',
    'ଆଜି', 'ଆଜିର',
    'আজি', 'আজিৰ',
    'آج', 'آج کی',
    'आज', 'आजको',
    'आज',
    'আজ',
    'आज',
    'आज',
    'आज',
    'अद्य',
    'آز',
    'आज',
    'ᱛᱮᱦᱮᱧ'
  ],

  balance: [
    'balance', 'outstanding', 'pending', 'baaki', 'baki', 'bakyulu', 'nilva', 'bakilu',
    'బాకీ', 'బాకీలు', 'బ్యాలెన్స్', 'పెండింగ్', 'మిగిలిన', 'నిల్వ',
    'बाकी', 'बैलेंस', 'बकाया', 'लंबित', 'शेष',
    'பாக்கி', 'மீதி', 'பாலன்ஸ்',
    'ಬಾಕಿ', 'ಬ್ಯಾಲೆನ್ಸ್', 'ಉಳಿಕೆ',
    'ബാക്കി', 'ബാലൻസ്',
    'बाकी', 'बैलेंस', 'शिल्लक',
    'বাকি', 'ব্যালেন্স',
    'બાકી', 'બેલેન્સ',
    'ਬਾਕੀ', 'ਬੈਲੈਂਸ',
    'ବାକି', 'ବ୍ୟାଲେନ୍ସ',
    'বাকী',
    'بقایا', 'بیلنس',
    'बाँकी', 'ब्यालेन्स',
    'बाकी',
    'বাকি',
    'बाकी',
    'बाकी',
    'बाकी',
    'अवशिष्टम्', 'शेषम्',
    'باقَی',
    'बाकी',
    'ᱥᱟᱨᱮᱡ'
  ],

  cashInHand: [
    'cash in hand', 'cash in-hand', 'cash', 'nagadu', 'rokka', 'rokkam', 'roka', 'chethi rokkam',
    'చేతిలో నగదు', 'నగదు', 'రొక్కం', 'క్యాష్',
    'हाथ में रोकड़', 'रोकड़', 'नकद', 'कैश',
    'கையிருப்பு ரொக்கம்', 'ரொக்கம்', 'கேஷ்',
    'ಕೈಯಲ್ಲಿರುವ ನಗದು', 'ನಗದು', 'ಕ್ಯಾಶ್',
    'കയ്യിലുള്ള പണം', 'പണം',
    'हातात रोख', 'रोख',
    'হাতে নগদ', 'নগদ',
    'હાથ પર રોકડ', 'રોકડ',
    'ਹੱਥ ਵਿਚ ਨਕਦ', 'ਨਕਦ',
    'ହାତରେ ନଗଦ', 'ନଗଦ',
    'হাতত নগদ',
    'نقد رقم', 'کیش',
    'हातमा नगद', 'नगद',
    'हातात रोख',
    'হাতত নগদ',
    'हातात रोख',
    'हाथ में नकद',
    'हाथ में नकद',
    'हस्ते धनम्', 'नकदम्',
    'نَقَد',
    'हाथ में नकद',
    'ᱛᱤ ᱨᱮ ᱴᱟᱠᱟ'
  ],

  interest: [
    'interest', 'vaddi', 'vaddi-khata', 'byaj', 'byaja', 'vatti', 'baddi', 'baddi-panam',
    'వడ్డీ', 'వడ్డీలు', 'వడ్డీ ఆదాయం',
    'ब्याज', 'ब्याज़',
    'வட்டி', 'வட்டி வருமானம்',
    'ಬಡ್ಡಿ', 'ಬಡ್ಡಿ ಆದಾಯ',
    'പലിശ',
    'व्याज',
    'সুদ',
    'વ્યાજ',
    'ਵਿਆਜ',
    'ସୁଧ',
    'সুদ',
    'سود',
    'ब्याज',
    'व्याज',
    'সুদ',
    'व्याज',
    'ब्याज',
    'ब्याज',
    'वृद्धिः', 'ब्याजम्',
    'سُود',
    'ब्याज',
    'ᱥᱩᱫᱽ'
  ],

  expenses: [
    'expense', 'expenses', 'kharchu', 'kharchulu', 'kharcha', 'kharch', 'selavu', 'karchu',
    'ఖర్చులు', 'ఖర్చు', 'వియోగాలు',
    'खर्च', 'खर्चे', 'व्यय',
    'செலவு', 'செலவுகள்',
    'ಖರ್ಚು', 'ಖರ್ಚುಗಳು', 'ವೆಚ್ಚ',
    'ചെലവ്',
    'खर्च',
    'খরচ', 'ব্যয়',
    'ખર્ચ',
    'ਖਰਚਾ', 'ਖਰਚੇ',
    'ଖର୍ଚ୍ଚ',
    'খৰচ',
    'اخراجات', 'خرچہ',
    'खर्च', 'खर्चहरू',
    'खर्च',
    'খরচ',
    'खर्च',
    'खर्च',
    'खर्च',
    'व्ययः', 'व्ययाः',
    'کَھرَছ',
    'खर्च',
    'ᱠᱷᱚᱨᱚᱪ'
  ]
};
