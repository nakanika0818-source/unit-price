# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 現状

Next.js 16.4.1（create-next-app で作成）の雛形と、タイトル・説明だけのトップ画面まで実装済み。入力欄・計算機能はまだない。

## コマンド

```
npm run dev     # 開発サーバー（http://localhost:3000）
npm run build   # 本番ビルド
npm run lint    # ESLint（Next.js 16 では `next lint` ではなく `eslint`）
```

テストはまだ導入していない（Vitest を導入予定）。導入後に、テスト実行と単一テストの実行方法をここに追記すること。

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
