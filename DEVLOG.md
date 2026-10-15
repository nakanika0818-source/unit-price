# DEVLOG

つまずいたことと、その解決方法の記録。

## 2026-10-15 雛形の作成

- **create-next-app を既存のフォルダで使えない可能性**：`requirements.md`・`CLAUDE.md` があるフォルダには作成できない場合があり、作成時に `CLAUDE.md` / `AGENTS.md` が上書きされるおそれもあった。
  → 一時フォルダで `--skip-install --disable-git --no-agents-md` を付けて作成し、`cp -n`（上書きしないコピー）でプロジェクトへ移した。
- **雛形の lint コマンド**：Next.js 16 の雛形では `"lint": "eslint"` になっていた（`next lint` ではない）。
- **375px のスクリーンショットで右端が切れて見えた**：ヘッドレス Edge の `--window-size=375,...` では、ウィンドウが最小幅より狭くならず、実際の表示幅が375pxより広くなっていた。
  → 幅375pxの iframe の中にページを表示して撮影し直し、はみ出しがないことを確認した。
- **npm install の警告**：high の脆弱性が5件と報告された。また、`unrs-resolver` の postinstall スクリプトが許可されていないという警告が出た。lint とビルドには影響がなかった。`npm audit fix --force` は大きな変更を含むため実行していない（未対応）。
