import { describe, it, expect } from "vitest";
import { GeminiSummarizer } from "../gemini-summarizer";
// 💡 実際の API を叩くので、APIキーが正しく設定されている必要があります
describe("GeminiSummarizer (Live API Test)", () => {
  it("実際に要約が生成されるか確認", async () => {
    const summarizer = new GeminiSummarizer();
    const content = `
      GPT-4やGeminiなどの大規模言語モデル（LLM）の進化により、
      プログラミングの在り方が大きく変わりつつあります。
      AIエージェントは自律的にコードを書き、バグを修正し、
      テストを実行することができるようになっています。
      開発者はより高度な設計や問題解決に集中できる一方で、
      AIが出力したコードの妥当性を検証する能力が強く求められています。
    `;
    console.log("--- 要約開始 ---");
    const summary = await summarizer.summarize(content);
    console.log("生成された要約:\n", summary);

    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("string");
  }, 60000); // API通信に時間がかかる場合があるので60秒タイムアウト設定設定
});
