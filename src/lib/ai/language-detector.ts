import { SupportedLanguageCode, ALL_SUPPORTED_LANGUAGES } from './multilingual-lexicon';

export interface DetectionResult {
  detectedCode: SupportedLanguageCode;
  effectiveCode: SupportedLanguageCode;
  script: 'native' | 'roman' | 'mixed';
  confidence: number;
}

/**
 * High-speed Pan-India Language & Script Detector
 */
export function detectLanguage(
  text: string,
  preferredOverride: SupportedLanguageCode = 'auto'
): DetectionResult {
  const query = (text || '').trim();
  if (!query) {
    return {
      detectedCode: 'en',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'en',
      script: 'roman',
      confidence: 1.0,
    };
  }

  // 1. Check Unicode script ranges for native Indian scripts
  const devanagariRange = /[\u0900-\u097F]/;
  if (devanagariRange.test(query)) {
    const lower = query.toLowerCase();
    let specificCode: SupportedLanguageCode = 'hi';

    if (lower.includes('किती') || lower.includes('आजचे') || lower.includes('आहे') || lower.includes('झाले') || lower.includes('शिल्लक')) {
      specificCode = 'mr';
    } else if (lower.includes('कति') || lower.includes('छ')) {
      specificCode = 'ne';
    } else if (lower.includes('सङ्ग्रह') || lower.includes('ऋणम्')) {
      specificCode = 'sa';
    }

    return {
      detectedCode: specificCode,
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : specificCode,
      script: 'native',
      confidence: 0.95,
    };
  }

  for (const meta of ALL_SUPPORTED_LANGUAGES) {
    if (meta.scriptRange && meta.code !== 'auto' && meta.code !== 'en') {
      if (meta.scriptRange.test(query)) {
        let specificCode = meta.code;

        if (meta.scriptRange.source.includes('0980-099F')) {
          // Bengali vs Assamese vs Manipuri
          if (query.includes('কত') || query.includes('টাকা') || query.includes('হয়েছে') || query.includes('আজকের')) {
            specificCode = 'bn';
          } else if (query.includes('কিমান') || query.includes('হৈছে')) {
            specificCode = 'as';
          }
        }

        return {
          detectedCode: specificCode,
          effectiveCode: preferredOverride !== 'auto' ? preferredOverride : specificCode,
          script: 'native',
          confidence: 0.95,
        };
      }
    }
  }

  // 2. Roman script heuristics for transliterations
  const lowerQuery = query.toLowerCase();

  // Telugu transliterations
  if (
    lowerQuery.includes('ivala') || lowerQuery.includes('eeroju') || lowerQuery.includes('entha') ||
    lowerQuery.includes('vachindi') || lowerQuery.includes('undi') || lowerQuery.includes('mandi') ||
    lowerQuery.includes('appu') || lowerQuery.includes('vaddi') || lowerQuery.includes('kharchu') ||
    lowerQuery.includes('chethi') || lowerQuery.includes('baki')
  ) {
    return {
      detectedCode: 'te',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'te',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Hindi transliterations
  if (
    lowerQuery.includes('aaj') || lowerQuery.includes('kitna') || lowerQuery.includes('kitne') ||
    lowerQuery.includes('hua') || lowerQuery.includes('hai') || lowerQuery.includes('kya') ||
    lowerQuery.includes('batao') || lowerQuery.includes('bataiye') || lowerQuery.includes('mante')
  ) {
    return {
      detectedCode: 'hi',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'hi',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Tamil transliterations
  if (
    lowerQuery.includes('inru') || lowerQuery.includes('inniki') || lowerQuery.includes('evvalavu') ||
    lowerQuery.includes('vandhadhu') || lowerQuery.includes('vandhu') || lowerQuery.includes('iru') ||
    lowerQuery.includes('irukku') || lowerQuery.includes('kadan')
  ) {
    return {
      detectedCode: 'ta',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'ta',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Kannada transliterations
  if (
    lowerQuery.includes('ivattu') || lowerQuery.includes('eshtu') || lowerQuery.includes('aaitu') ||
    lowerQuery.includes('ayitu') || lowerQuery.includes('ide') || lowerQuery.includes('madi')
  ) {
    return {
      detectedCode: 'kn',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'kn',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Malayalam transliterations
  if (
    lowerQuery.includes('innathe') || lowerQuery.includes('etra') || lowerQuery.includes('und') ||
    lowerQuery.includes('vannu') || lowerQuery.includes('vanna')
  ) {
    return {
      detectedCode: 'ml',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'ml',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Bengali transliterations
  if (
    lowerQuery.includes('aajker') || lowerQuery.includes('kat') || lowerQuery.includes('taka') ||
    lowerQuery.includes('hoyeche') || lowerQuery.includes('ache')
  ) {
    return {
      detectedCode: 'bn',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'bn',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Gujarati transliterations
  if (
    lowerQuery.includes('aajnu') || lowerQuery.includes('ketlu') || lowerQuery.includes('thayu') ||
    lowerQuery.includes('che')
  ) {
    return {
      detectedCode: 'gu',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'gu',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Marathi transliterations
  if (
    lowerQuery.includes('aajche') || lowerQuery.includes('kiti') || lowerQuery.includes('jhale') ||
    lowerQuery.includes('ahe')
  ) {
    return {
      detectedCode: 'mr',
      effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'mr',
      script: 'roman',
      confidence: 0.9,
    };
  }

  // Default to English if no other script or transliteration detected
  return {
    detectedCode: 'en',
    effectiveCode: preferredOverride !== 'auto' ? preferredOverride : 'en',
    script: 'roman',
    confidence: 0.8,
  };
}
