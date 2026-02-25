import { defineConfig } from "vitest/config";
import path from "path";
import { config } from "dotenv";

// .env ファイルから環境変数をロード
config();

export default defineConfig({
  test: {
    // テストファイルのパターン
    include: ["src/**/*.test.ts"],
    // Node.js 環境で実行（APIルートやUseCaseのテスト向け）
    environment: "node",
  },
  resolve: {
    alias: {
      // tsconfig.json の paths と同じ設定にする
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
