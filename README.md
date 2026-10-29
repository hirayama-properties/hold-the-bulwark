# HOLD THE BULWARK: The Undead Legion — 公式サイト

スマホゲーム「HOLD THE BULWARK: The Undead Legion」の紹介・ダウンロード誘導用ランディングページです。

- 静的サイト（HTML / CSS / 素の JavaScript）。フレームワーク・ビルド不要。
- 日本語：`/` 、英語：`/en/`。初回訪問時はブラウザの言語設定で振り分け、手動切替も可能。
- トラッキング・クッキーなし（言語の手動選択だけ `sessionStorage` に保存）。

## 構成

```
index.html          日本語ページ
en/index.html       英語ページ
privacy/ terms/ tokusho/            プライバシーポリシー・利用規約・特定商取引法に基づく表記（日本語）
en/privacy/ en/terms/              Privacy Policy・Terms of Service（英語）
assets/css/style.css
assets/js/main.js   メニュー、スクリーンショット拡大、iOS判定、言語振り分け
assets/img/         画像（WebP）、OGP画像、アイコン
favicon.ico
```

## 公開前・公開後に差し替える箇所

| 内容 | 場所 |
|---|---|
| Google Play のURL | 各 `index.html` 内の `play.google.com` のリンク（全ページ共通の同じURL） |
| App Store 公開時 | 各 `index.html` 末尾の `window.BULWARK` の `appStoreUrl` にURLを入れると、iPhone/iPad では「App Storeで入手」に切り替わる。ヒーロー・最終CTAの「iOS版は準備中」表示は手動で差し替え |
| サイトのURL（OGP・canonical） | 各 `index.html` の `<head>` 内の絶対URL |

## ローカルで確認

```
python3 -m http.server 8000
# → http://localhost:8000/
```

Google Play および Google Play ロゴは Google LLC の商標です。
© 2026 Hirayama Properties K.K.
