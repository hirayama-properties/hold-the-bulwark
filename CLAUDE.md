# HOLD THE BULWARK 公式サイト — 作業メモ（Claude向け）

https://holdthebulwark.com/ の静的サイト。GitHub Pages（このリポジトリの `main` ブランチ直下）で公開している。
`main` にプッシュすると1〜2分で本番に反映される。独自ドメインは `CNAME`、DNSはXサーバードメイン側で設定済み。

## どこを直せばいいか

| 直したいもの | 編集するファイル |
|---|---|
| トップページ（日本語・英語とも）の文言・構成・見た目 | `design/Main.dc.html` |
| 文言だけ（日英の辞書） | `design/Main.dc.html` 末尾の `texts()` 内 `ja:` / `en:` |
| リンク先（Google Play・App Store・お問い合わせフォーム・規約） | `design/Main.dc.html` の `renderVals()` 冒頭の定数（`PLAY_URL` `APP_STORE_URL` `CONTACT_URL`） |
| プライバシーポリシー・利用規約・特商法 | `tools/legal/*.md`（ja-privacy / ja-terms / ja-tokusho / en-privacy / en-terms） |
| 規約ページの見た目 | `tools/legal.mjs` 末尾の `legal.css` |
| メニュー・スクショ拡大・iOS判定・言語の自動振り分け | `assets/js/main.js`（手書き。ビルドで上書きされない） |
| 画像 | `assets/img/`（WebP推奨） |

**`index.html` / `en/index.html` / `privacy/` などの HTML と `assets/css/*.css` はビルドで生成される。直接編集しないこと**（次のビルドで消える）。

## ビルドと公開

```bash
tools/build.sh                # Node.js 18+。全ページを再生成し、CSS/JSのURLに版番号(?v=)を付ける
python3 -m http.server 8000   # 確認用 → http://localhost:8000/ と /en/
git add -A && git commit -m "..." && git push origin main
```

- スマホ幅（375〜390px）とデスクトップ幅の両方で、横スクロールが出ないこと・JSエラーがないことを確認してからプッシュする。
- `?v=` の版番号はCSS/JSの中身から自動で付く。GitHub Pagesのキャッシュ対策なので外さない。

## design/Main.dc.html の書き方

Claude の「Design」キャンバス形式（`.dc.html`）。`tools/build.mjs` がこれを日英2枚の静的HTMLに変換する。

- `{{t.xxx}}` は `texts()` の文言、`{{playUrl}}` などは `renderVals()` の値に置き換わる。`{{ }}` の中は単純な参照のみ（式は不可）。
- `<sc-if>` / `<sc-for>` / `onClick` は build.mjs が対応しているもの（メニュー、スクショ、iOSボタン切替、火の粉）だけ変換できる。新しく増やす場合は build.mjs と main.js も合わせて直す。
- 画像の参照:
  - 既存の画像は `/_blob/<32桁のID>` で書かれており、build.mjs 冒頭の `BLOBS` 表で `assets/img/` のファイル名に置き換わる。
  - **新しい画像は `assets/img/` に置き、`/assets/img/ファイル名.webp` のようにルートからのパスで書く**（日英どちらのページでもそのまま動く）。
- スタイルは `<helmet><style>` 内（→ `assets/css/style.css` に出力）と、各要素のインライン `style`。
- 元のキャンバス（Claude の Artifacts にある「HOLD THE BULWARK 公式サイト」）はデザイン確認用。**正はこのリポジトリの `design/Main.dc.html`**。キャンバス側で直した場合は、その内容をこのファイルに反映してからビルドする。

## 守ること（サイトの方針）

- トラッキング・クッキーは入れない（アクセス解析を入れるなら事前に相談）。外部埋め込み（フォーム・動画など）はリンクで置く。
- ダウンロード数・評価・レビューを、実績ができるまで載せない。「No.1」など根拠のない最上級表現は使わない。
- Google Play / Apple の公式ロゴ・バッジを手で描き起こさない（使うなら公式配布の画像ファイルをそのまま）。App Store の公式バッジを使う場合は、Apple の配布画像をそのまま使い、並べるときは App Store を先にする。
- 動きを減らす設定（prefers-reduced-motion）とコントラストを保つ。

## 今後の予定・残作業

- iOS版は2026年11月に App Store で配信開始済み（`APP_STORE_URL` 設定済み）。iPhone/iPad で開くと、ヘッダー等のボタンは自動で「App Storeで入手」になる。
- 英語版の特商法ページはない（英語ページからは日本語版へリンク）。

## 運営情報

- 運営：Hirayama Properties K.K.（平山プロパティーズ株式会社）
- お問い合わせ：https://forms.gle/QtNSUzpAxisWaQEp6
- Google Play：https://play.google.com/store/apps/details?id=com.hirayamaproperties.holdthebulwark
- App Store：https://apps.apple.com/jp/app/hold-the-bulwark/id6834996538
