import { GoogleGenerativeAI } from "@google/generative-ai";

export async function doubleCheck(before: string, change: string, after: string): Promise<[boolean, string?]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Compare the 'before' and 'after' code snippets, considering the provided 'change'. Determine if the change was applied correctly and if any unintended modifications were made. Respond with 'PASS' if correct, or 'FAIL' with a brief explanation if not.

Before:
${before}

Change:
${change}

After:
${after}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (text.startsWith('PASS')) {
      return [true];
    } else if (text.startsWith('FAIL')) {
      return [false, text.substring(5).trim()];
    } else {
      return [false, 'Unexpected response from Gemini API'];
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return [false, 'Error calling Gemini API'];
  }
}