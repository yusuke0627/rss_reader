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
注：
- 導入文（「要約は以下の通りです」など）や解説は一切含めず、箇条書きのリストのみを出力してください。
- 各行の先頭は必ずハイフンとスペース("- ")で始めてください。
記事内容:
${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // 導入文の削除と、中黒「・」や「*」をリスト用のハイフンに置換する後処理
    return text.replace(/^ご提示いただいた記事の要約は以下の通りです。\n*/, "")
               .replace(/^要約は以下の通りです。\n*/, "")
               .replace(/^[・*]\s*/gm, "- ")
               .trim();
  }
}
