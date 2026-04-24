import OpenAI from 'openai';
import { logger } from '../../common/utils/logger';
import { env } from '../../common/config/env';

export interface AnalyzeImageResult {
  name: string;
  brandName: string;
  descriptionUz: string;
  howToUseUz: string;
  ingredients: string[];
  skinTypes: string[];
  benefits: string[];
}

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function analyzeImage(imageUrl: string): Promise<AnalyzeImageResult> {
  let response;
  try {
    response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Korean cosmetics expert. Analyze this product image 
and return ONLY a JSON object with no markdown, no extra text.

Extract and return:
{
  "name": "product name exactly as shown on packaging in Latin script",
  "brand_name": "brand name from packaging",
  "description_uz": "2-3 sentence product description in Uzbek language",
  "how_to_use_uz": "2-3 sentences on how to use this product, in Uzbek",
  "ingredients": ["top 3 main ingredients visible or known for this product type"],
  "skin_types": ["suitable skin types from: Quruq, Yog'li, Kombinatsiyalashgan, Sezgir, Normal"],
  "benefits": ["3-4 main benefits of this product in Uzbek, short phrases"]
}

Rules:
- ingredients: list top 3 key ingredients (e.g. Niacinamide, Hyaluronic Acid, Centella)
- skin_types: only use values from the allowed list above
- benefits: short Uzbek phrases like 'Terini namlaydi', 'Quyoshdan himoya qiladi'
- All text fields in Uzbek except name and brand_name
- Return ONLY the JSON object`,
        },
        {
          role: 'user',
          content: [{ type: 'image_url', image_url: { url: imageUrl } }],
        },
      ],
      max_tokens: 400,
    });
  } catch (error) {
    logger.error({ error, imageUrl }, 'OpenAI analyzeImage API call failed');
    throw error;
  }

  const raw = response.choices[0]?.message?.content ?? '{}';
  logger.debug({ raw }, 'AI analyze response');

  let parsed: { 
    name?: string; 
    brand_name?: string; 
    description_uz?: string; 
    how_to_use_uz?: string; 
    ingredients?: string[];
    skin_types?: string[];
    benefits?: string[] 
  };
  try {
    parsed = JSON.parse(raw) as any;
  } catch (error) {
    logger.error({ error, raw }, 'AI analyze JSON parse failed');
    throw new Error('AI_PARSE_FAILED');
  }

  if (
    !parsed.name || 
    !parsed.brand_name || 
    !parsed.description_uz || 
    !parsed.how_to_use_uz || 
    !parsed.benefits ||
    !parsed.ingredients ||
    !parsed.skin_types
  ) {
    logger.error({ parsed }, 'AI analyze response missing required fields');
    throw new Error('AI_PARSE_FAILED');
  }

  return {
    name: parsed.name,
    brandName: parsed.brand_name,
    descriptionUz: parsed.description_uz,
    howToUseUz: parsed.how_to_use_uz,
    ingredients: parsed.ingredients,
    skinTypes: parsed.skin_types,
    benefits: parsed.benefits,
  };
}