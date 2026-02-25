import { GoogleGenerativeAI } from "@google/generative-ai";
import { Summarizer } from "@/application/ports/summarizer";

export class GeminiSummarizer implements Summarizer {
  private readonly genAI: GoogleGenerativeAI;
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async summarize(content: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    // プロンプトの組み立て
    const prompt = `以下の記事を重要なポイントを絞って日本語で3行程度の箇条書きで要約してください。
記事内容:
${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}
