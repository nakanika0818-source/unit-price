# DEVLOG

つまずいたことと、その解決方法の記録。

## 2026-10-15 雛形の作成

- **create-next-app を既存のフォルダで使えない可能性**：`requirements.md`・`CLAUDE.md` があるフォルダには作成できない場合があり、作成時に `CLAUDE.md` / `AGENTS.md` が上書きされるおそれもあった。
  → 一時フォルダで `--skip-install --disable-git --no-agents-md` を付けて作成し、`cp -n`（上書きしないコピー）でプロジェクトへ移した。
- **雛形の lint コマンド**：Next.js 16 の雛形では `"lint": "eslint"` になっていた（`next lint` ではない）。
- **375px のスクリーンショットで右端が切れて見えた**：ヘッドレス Edge の `--window-size=375,...` では、ウィンドウが最小幅より狭くならず、実際の表示幅が375pxより広くなっていた。
  → 幅375pxの iframe の中にページを表示して撮影し直し、はみ出しがないことを確認した。
- **AGENTS.md が自動で作られた**：`--no-agents-md` を付けて作成したが、`next dev` を起動したときに Next.js 16 が `AGENTS.md` を作成した（`node_modules/next/dist/server/lib/generate-agent-files.js` で確認）。消しても再作成されるため、コミットに含めた。対象は `AGENTS.md` だけで、`CLAUDE.md` は変更されていない。
- **npm install の警告**：high の脆弱性が5件と報告された。また、`unrs-resolver` の postinstall スクリプトが許可されていないという警告が出た。lint とビルドには影響がなかった。`npm audit fix --force` は大きな変更を含むため実行していない（未対応）。→ 調査結果は次の節を参照。

## 2026-10-15 入力チェックと単価計算（Vitest）

- **Vitest 5 の peer dependency エラー**：`npm install -D vitest` が ERESOLVE で失敗した。Vitest 5.0.4 は `@types/node` 22 以上を求めるが、雛形は `^20` だった。
  → 実行環境の Node 24 に合わせて `@types/node@^24` に上げ、同時に入れ直した（`--force` / `--legacy-peer-deps` は使っていない）。
- **小数の誤差の実例**：`1円/0.3mL` と `7円/2.1mL` は数学的には同じ単価だが、割り算すると `3.3333333333333335` と `3.333333333333333` になり、判定がずれる。
  → 判定は割り算をせず、「価格 × 相手の数量」の整数どうしで比べる。この例はテストに入れた。
- **丸めの誤差**：`(1.005).toFixed(2)` は `"1.00"` になる。
  → 表示用の値は BigInt の分数から整数演算で四捨五入し、`"1.01"` になることをテストで確認した。
- **確認結果**：`npm test` 30件成功、`npm run lint` 成功、`npm run build` 成功、`npx tsc --noEmit` 成功。

### npm audit の調査（high 5件）

- 原因は1つで、`braces@3.0.3` の [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)（深くネストしたパターンでスタックを使い切る DoS）。対象範囲は全バージョンで、修正版は出ていない。
- 依存経路：`eslint-config-next@16.4.1` → `@next/eslint-plugin-next` → `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces`。残りの4件は、この経路上のパッケージが連鎖して数えられているもの。
- 本番への影響：なし。lint 用の devDependency の中だけにあり、`npm audit --omit=dev` は0件。`next build` の成果物にも含まれない。また、攻撃者が用意した glob パターンを処理する場面がないため、開発時の影響も実質的にない。
- `npm audit fix --force` を実行すると `eslint-config-next@14.2.35` に戻ってしまい、Next.js 16 と合わなくなる。そのため実行しない。`eslint-config-next` の更新を待つ（2026-10-15 時点の最新は 16.4.1 で、これも該当する）。
- Vitest を追加しても件数は変わらなかった。

## 2026-10-15 単位選択と商品カード（F-01・F-02）

- **操作の確認方法**：単位を切り替えても値が残るかどうかは、スクリーンショットでは確かめられない。
  → Next.js 同梱ガイド（`testing/vitest.md`）に沿って jsdom と Testing Library を入れ、コンポーネントテストで確認した。
- **vite-tsconfig-paths の警告**：ガイドどおりに `vite-tsconfig-paths` を入れたところ、Vite から「パス解決は組み込みの `resolve.tsconfigPaths` で対応済み」と警告が出た。
  → プラグインを削除し、`resolve: { tsconfigPaths: true }` に置き換えた。
- **jest-dom の判定が使えない**：`toBeChecked` などの判定は Testing Library 本体には含まれていない。
  → `@testing-library/jest-dom` を追加し、テストファイルで `@testing-library/jest-dom/vitest` を import した。
- **入力欄の枠線が見えにくい**：最初は淡いブルー（#dbeafe）の枠線にしたが、アイボリーの背景とほとんど区別できなかった。
  → 入力欄だけ `--field-border: #7c8ca6` に変えた。また、「円」と単位表示の幅を揃えて、入力欄の右端を揃えた。
- **確認結果**：`npm test` 34件成功、lint・型チェック・本番ビルド成功。375px 幅（iframe で撮影）では縦並び、1100px 幅では横並びになり、横スクロールが出ないことをスクリーンショットで確認した。
  - `app` `components` `lib` に console・localStorage・sessionStorage・Cookie・fetch を使ったコードがないことを grep で確認した。
  - npm audit は high 5件のままで、増えていない（すべて lint 用の依存の中）。
