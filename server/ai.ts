import { GoogleGenAI, Type } from '@google/genai';

// Initialize server-side Gemini client per skill instructions
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface AnalyzedDescription {
  title: string;
  category: string;
  subcategory: string;
  brand: string;
  color: string;
  distinguishingFeatures: string[];
  keywords: string[];
  suggestedVerificationQuestions: string[];
  confidence: number;
}

export async function analyzeItemDescription(rawText: string): Promise<AnalyzedDescription> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Description text is required');
  }

  // If Gemini is available, use structured generation
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analyze this lost/found report text and extract structured attributes: "${rawText}"`,
        config: {
          systemInstruction:
            'You are TraceBack AI, an expert lost-and-found attribute extractor. ' +
            'Extract clean title, standard category (one of: Electronics, Bags & Luggage, Personal Accessories, Keys & Badges, Documents & IDs, Clothing & Footwear, Books & Stationery, Others), subcategory, brand/maker, predominant color, distinguishing features, search keywords, and 2 private verification questions that a genuine owner could answer to prove ownership (e.g., sticker description, lockscreen wallpaper, engravings). Return in valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Concise, clean title' },
              category: { type: Type.STRING, description: 'High-level category' },
              subcategory: { type: Type.STRING, description: 'Specific subcategory' },
              brand: { type: Type.STRING, description: 'Brand or Unknown' },
              color: { type: Type.STRING, description: 'Dominant color' },
              distinguishingFeatures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key visible or physical marks',
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Search terms',
              },
              suggestedVerificationQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Questions only the real owner can answer',
              },
            },
            required: ['title', 'category', 'subcategory', 'brand', 'color', 'distinguishingFeatures', 'suggestedVerificationQuestions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        title: parsed.title || 'Reported Belonging',
        category: parsed.category || 'Electronics',
        subcategory: parsed.subcategory || 'General',
        brand: parsed.brand || 'Unspecified',
        color: parsed.color || 'Unspecified',
        distinguishingFeatures: parsed.distinguishingFeatures || [],
        keywords: parsed.keywords || [],
        suggestedVerificationQuestions: parsed.suggestedVerificationQuestions || [
          'Can you describe any unique stickers, scratches, or wear marks?',
          'What is a distinctive item inside or attached to this belonging?',
        ],
        confidence: 0.95,
      };
    } catch (err) {
      console.warn('[Gemini AI] Description extraction fallback:', err);
    }
  }

  // Deterministic local parsing fallback
  return fallbackDescriptionExtraction(rawText);
}

function fallbackDescriptionExtraction(text: string): AnalyzedDescription {
  const lower = text.toLowerCase();

  let category = 'Others';
  let subcategory = 'General Item';
  let brand = 'Unmarked';
  let color = 'Dark';

  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('thinkpad') || lower.includes('dell')) {
    category = 'Electronics';
    subcategory = 'Laptops';
    if (lower.includes('apple') || lower.includes('macbook')) brand = 'Apple';
    else if (lower.includes('lenovo') || lower.includes('thinkpad')) brand = 'Lenovo';
    else if (lower.includes('dell')) brand = 'Dell';
  } else if (lower.includes('iphone') || lower.includes('samsung') || lower.includes('phone') || lower.includes('pixel')) {
    category = 'Electronics';
    subcategory = 'Smartphones';
    if (lower.includes('apple') || lower.includes('iphone')) brand = 'Apple';
    else if (lower.includes('samsung') || lower.includes('galaxy')) brand = 'Samsung';
    else if (lower.includes('pixel')) brand = 'Google';
  } else if (lower.includes('headphone') || lower.includes('airpod') || lower.includes('sony') || lower.includes('bose') || lower.includes('earbud')) {
    category = 'Electronics';
    subcategory = 'Headphones';
    if (lower.includes('sony')) brand = 'Sony';
    else if (lower.includes('apple') || lower.includes('airpod')) brand = 'Apple';
    else if (lower.includes('bose')) brand = 'Bose';
  } else if (lower.includes('backpack') || lower.includes('bag') || lower.includes('rucksack')) {
    category = 'Bags & Luggage';
    subcategory = 'Backpacks';
    if (lower.includes('bellroy')) brand = 'Bellroy';
    else if (lower.includes('north face')) brand = 'The North Face';
    else if (lower.includes('fjallraven')) brand = 'Fjallraven';
  } else if (lower.includes('key') || lower.includes('fob') || lower.includes('lanyard')) {
    category = 'Keys & Badges';
    subcategory = 'Keys';
  } else if (lower.includes('wallet') || lower.includes('cardholder') || lower.includes('purse')) {
    category = 'Personal Accessories';
    subcategory = 'Wallets';
  } else if (lower.includes('watch') || lower.includes('garmin')) {
    category = 'Personal Accessories';
    subcategory = 'Watches';
  } else if (lower.includes('bottle') || lower.includes('flask') || lower.includes('hydro')) {
    category = 'Personal Accessories';
    subcategory = 'Water Bottles';
  }

  const colors = ['black', 'space gray', 'silver', 'white', 'navy', 'blue', 'red', 'green', 'charcoal', 'brown', 'gold', 'purple', 'yellow'];
  for (const c of colors) {
    if (lower.includes(c)) {
      color = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  const features: string[] = [];
  if (lower.includes('sticker')) features.push('Has custom decorative sticker');
  if (lower.includes('scratch') || lower.includes('dent')) features.push('Visible surface scratch/dent');
  if (lower.includes('case') || lower.includes('sleeve')) features.push('Enclosed in protective case or sleeve');
  if (lower.includes('cable') || lower.includes('charger')) features.push('Accompanied by charging cable');

  return {
    title: `${color} ${brand !== 'Unmarked' ? brand : ''} ${subcategory}`.trim(),
    category,
    subcategory,
    brand,
    color,
    distinguishingFeatures: features.length > 0 ? features : ['Standard wear marks', 'Identifying characteristics noted'],
    keywords: text.split(/\s+/).filter((w) => w.length > 3).slice(0, 6),
    suggestedVerificationQuestions: [
      `What distinctive mark or identifier is on this ${brand !== 'Unmarked' ? brand : subcategory}?`,
      'Can you describe any unique items or serial ending stored with this belonging?',
    ],
    confidence: 0.82,
  };
}

export async function explainMatch(lostSummary: string, foundSummary: string): Promise<string> {
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Compare these two lost-and-found reports and provide a concise, objective 2-sentence rationale of similarities and verification advice for human staff:
Report A (Lost): ${lostSummary}
Report B (Found): ${foundSummary}

Rules:
1. Never declare ownership verified.
2. Emphasize that candidate ranking requires physical ownership verification.
3. Be professional and concise.`,
      });
      return response.text?.trim() || 'Descriptive similarities indicate strong candidate compatibility for review.';
    } catch (e) {
      console.warn('[Gemini AI] Match explanation fallback:', e);
    }
  }
  return 'Automated candidate ranking based on category, brand, and temporal proximity. Physical ownership verification required before handover.';
}
