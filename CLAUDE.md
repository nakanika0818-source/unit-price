# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 現状

Next.js 16.4.1 の雛形、`lib/` の入力チェックと単価計算、入力画面、比較・結果表示・エラー表示、入力変更で結果を消す処理まで実装済み。リセットはまだない。

## コマンド

```
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド
npm run lint         # ESLint（Next.js 16 では `next lint` ではなく `eslint`）
npm test             # Vitest を1回実行（vitest run）
npm run test:watch   # Vitest をウォッチモードで実行
npx vitest run lib/compare.test.ts      # 1ファイルだけ実行
npx vitest run -t "完成条件"            # テスト名で絞り込んで実行
```

Vitest の設定は `vitest.config.mts`。既定は Node 環境で、`@/` のパスは Vite 組み込みの `resolve.tsconfigPaths` で解決する（`vite-tsconfig-paths` プラグインは不要）。コンポーネントのテストはファイル先頭に `// @vitest-environment jsdom` を書き、`@testing-library/jest-dom/vitest` を import して、`afterEach(cleanup)` を呼ぶ（グローバル設定を使っていないため、自動では片付かない）。

## ロジックの構成（`lib/`）

- `units.ts`：単位の一覧と、小数の数量を許可する単位（mL・g）。
- `validation.ts`：入力文字列（全角は NFKC で半角化）を検証し、価格は整数、数量は1000倍した整数（`quantityScaled`）で返す。エラーは日本語メッセージ付き。
- `compare.ts`：`compareProducts(a, b)` が判定・表示用の文字列・`hiddenByRounding`（表示上は差が見えない）を返す。判定は `価格A × 数量B` と `価格B × 数量A` の整数比較で行う。表示用の単価・差額は BigInt の分数から小数第2位で1回だけ四捨五入し、末尾の0を省いて3桁区切りにする。差額は「丸めた単価どうしの差」ではない。
- `form.ts`：`evaluateForm(unit, {A, B})` が2商品分の入力チェックと `compareProducts` をまとめて行い、結果と表示名、または商品・欄ごとのエラーを返す。入力の型 `ProductInput` と、空欄時の表示名（`displayName`）もここにある。
- UI 側は `evaluateForm` を呼ぶだけにし、文字列を数値に変える処理を独自に書かないこと。

## 画面の構成（`components/`）

- `UnitPriceComparer.tsx`（`'use client'`）：単位・入力・エラー・結果（`outcome`：none / result / stale）を state で持つ唯一の場所。`<form>` の submit で比較するため、Enter キーでも比較できる。
  - 結果を表示した後に入力（商品名を含む）や単位を変えると、`outcome` を `stale` にして結果を消し、再比較を促す。
  - 編集した欄のエラーだけを消す。単位を変えたときは、両商品の数量のエラーを消す。単位を切り替えても入力値は消さない。
- `ProductCard.tsx`：1商品分の入力欄で、状態は持たない。エラーは `aria-invalid` と `aria-describedby` で入力欄に結び付ける。`UnitSelect.tsx`：単位のラジオボタン。`ComparisonResult.tsx`：結果の表示。
- 安い方は「安い」バッジ、エラーは「⚠」と文章で示し、色だけに頼らない。
- 入力欄は `type="text"` と `inputMode` を組み合わせる（`type="number"` は使わない）。単位が mL・g のときは `decimal`、それ以外は `numeric`。

## 雛形の設定メモ

- `next.config.ts` は create-next-app の生成どおりで、`cacheComponents` と `partialPrefetching` が有効。Tailwind CSS は Turbopack のローダー（`@tailwindcss/turbopack`）で読み込んでいる。
- フォントは Geist を外し、`app/globals.css` で日本語のシステムフォントを指定している。外部フォントは取得しない。
- 色は `app/globals.css` の CSS 変数（`background` / `surface` / `accent` / `accent-strong`）を Tailwind のクラス名として使う。

## アプリ概要

2つの商品の「価格 ÷ 数量」を共通単位で比較する、日本語の1画面アプリ（トップページ `/` のみ）。
技術スタック：Next.js（App Router）・TypeScript・Tailwind CSS。外部API・データベースは使わない。

## 作業ルール

- 作業場所は `C:\dev\unit-price` のみ。他のプロジェクト（dental-chart・dental-booking・weather-app など）には触れない。
- 仕様の基準は `requirements.md`。実装前に読み、迷ったらそちらに従う。
- Plan Mode で設計し、ユーザーが確認してから実装する。
- 機能ごとに動作確認してからコミットする。
- つまずいたことと、その解決方法を `DEVLOG.md` に短く記録する。
- 未実装のコマンドや未確認の結果を、実行済み・確認済みとして書かない。このファイル、README、DEVLOG、コミットメッセージ、ユーザーへの報告のすべてが対象。

## 実装上の重要な制約

要件の詳細は `requirements.md` の §4・§5・§9 を参照。見落としやすい点：

- **計算・入力チェックは UI から切り離した純粋な関数にする。** テスト対象になり、完成条件（§9）の具体的な値をテストケースにする。
- **入力値の検証は単位によって変わる。** 価格は 1〜1,000,000 の整数。数量は 0 より大きく 1,000,000 以下で、「個・枚・本」は整数のみ、「mL・g」は小数第3位まで。
- **安い方・同じ単価の判定は、表示用に丸める前の値で行う。** 浮動小数点の誤差で同額判定がずれないようにすること。たとえば、数量を1000倍して整数にし、`価格A × 数量B` と `価格B × 数量A` を比べると、割り算をせずに判定できる。表示は小数第2位まで。差があっても表示上同じになる場合は専用の案内文を出し、「同じ単価です」とは区別する。
- **入力（単位を含む）を変更したら、古い比較結果を消す。**
- **入力内容の保存・外部送信・ログ出力はしない。** 状態は React の state だけで持ち、localStorage・sessionStorage・Cookie・console 出力は使わない。
- 375px 幅で横スクロールを出さない。安い方やエラーは色だけでなく文字でも伝える。
