import { GoogleGenAI, Type } from "@google/genai";
import { Quote } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      quote: { type: Type.STRING, description: '名言原文，可以是任何语言。' },
      author: { type: Type.STRING, description: '作者的原文姓名。' },
      translation: { type: Type.STRING, description: '名言的中文翻译。' },
      source: { type: Type.STRING, description: '名言的出处（书籍、演讲等），可选。' },
    },
    required: ['quote', 'author', 'translation'],
  }
};

const fallbackQuotes: Quote[] = [
    {
        quote: "子曰：學而時習之，不亦說乎？",
        author: "孔子",
        translation: "Confucius said: 'To learn and then have occasion to practice what you have learned—is this not satisfying?'",
        source: "論語·學而篇"
    },
    {
        quote: "Veni, vidi, vici.",
        author: "Gaius Iulius Caesar",
        translation: "I came, I saw, I conquered.",
        source: "Life of Caesar by Plutarch"
    }
];

export const fetchQuotesBatch = async ({ category, seenQuotes }: { category: string; seenQuotes: Quote[]; }): Promise<Quote[]> => {
  const seenQuotesPrompt = seenQuotes.length > 0
    ? `Please do not include the following quotes: ${seenQuotes.map(q => `"${q.quote}"`).join(', ')}`
    : '';

  const categoryPrompt = category === '随机'
    ? 'Generate 10 random, profound, and lesser-known philosophical quotes from a diverse range of cultures and time periods (e.g., Ancient Greek, Roman, Latin American, African, Middle Eastern, Indian, East Asian philosophies).'
    : `Generate 10 profound and lesser-known philosophical quotes strictly related to the category of "${category}". The quotes should come from a diverse range of cultures and time periods.`;

  const prompt = `${categoryPrompt} For each quote, provide the original text, the author's name in their native language script, a Chinese translation, and the source (book, speech, etc.) if known. ${seenQuotesPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const quoteData = JSON.parse(jsonString);

    if (!Array.isArray(quoteData) || quoteData.length === 0) {
        console.warn("API returned empty or invalid data, using fallback.");
        return fallbackQuotes;
    }

    return quoteData.filter(q => q.quote && q.author && q.translation) as Quote[];
  } catch (error) {
    console.error("Error fetching quotes from Gemini API:", error);
    console.warn("Using fallback quotes due to API error.");
    return fallbackQuotes;
  }
};