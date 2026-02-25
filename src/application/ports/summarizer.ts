/**
 * AIによる要約機能を提供するインターフェース。
 * クリーンアーキテクチャの規約に基づき、特定のLLMプロバイダー（Gemini, OpenAI等）への依存を排除します。
 */
export interface Summarizer {
  /**
   * 与えられたテキスト（記事本文など）を集約し、要約文を生成します。
   * @param content 要約対象のテキスト
   * @returns 生成された要約文
   */
  summarize(content: string): Promise<string>;
}
