import { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import { applyCors, checkRateLimit } from '../_utils/security';

async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Payload size validation (Strict limit of 500KB to prevent memory exhaustion)
      if (body.length > 500000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Apply Strict CORS
  if (applyCors(req, res)) return;

  // Apply Strict Rate Limiting (max 10 requests per minute)
  if (checkRateLimit(req, res, 10, 60000)) return;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { prompt, catalog, faqs } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Prompt is required and must be under 2000 characters' }));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Gemini API Key is not configured' }));
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build standard system prompt context
    const catalogString = catalog && Array.isArray(catalog)
      ? catalog.map((p: any) => `- ${p.name} (${p.category}): ${p.desc} [KES ${p.price}]`).join('\n')
      : 'No product list available.';

    const faqsString = faqs && Array.isArray(faqs) && faqs.length > 0
      ? faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
      : 'No FAQs available.';

    const systemInstruction = `You are ALOEFLORA's expert AI Specialist based in Nairobi, Kenya.
Your role is to guide customers on organic, natural solutions for hair care (especially Kenyan curls/coils moisture), skin repair, body care, and healthy household surfaces.

Use the following catalog of ALOEFLORA products to answer the user's questions. Always recommend one or more matching products from this catalog if they fit the user's request. Give specific advice on how to use them.

ALOEFLORA Catalog:
${catalogString}

You also have access to our frequently asked questions. Use this knowledge to assist customers with queries about shipping, returns, policies, or general advice:
${faqsString}

Keep your tone warm, welcoming, professional, and culturally relevant to Kenya (feel free to use light Kenyan expressions like "Habari!", "Karibu" when appropriate). Be precise, helpful, and concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const resultText = response.text || "I apologize, but I am unable to generate a recommendation at the moment. Please feel free to check our products directly on the storefront!";

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ response: resultText }));
  } catch (error: any) {
    console.error('Gemini Consult Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
  }
}
