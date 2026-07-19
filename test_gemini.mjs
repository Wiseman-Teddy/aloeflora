import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Hello",
      config: {
        systemInstruction: "You are a helpful assistant.",
        temperature: 0.7,
      }
    });
    console.log(response.text);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
run();
