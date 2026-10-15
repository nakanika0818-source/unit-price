import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// lib/ のテストは Node 環境で動かす。
// コンポーネントのテストはファイル先頭に `// @vitest-environment jsdom` を書く。
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
});
