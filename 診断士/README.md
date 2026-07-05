# 二次答案ログ HTML演習

GitHub Pagesでそのまま使う、診断士二次試験向けの長文与件演習HTMLです。

## 使い方

1. このフォルダの中身をGitHubリポジトリに置く
2. GitHub Pagesで `index.html` を開く
3. `materials/materials_bundle.json` が起動時に直接一括で読み込まれる
4. 画面で事例と問題番号を選び、本文・分類・設問を進める

## 主な機能

- 事例I〜III、各10本、合計30本の教材セットを一括読込
- 本文3,500字前後の長文与件
- 本文ドラッグ選択による線引き・分類
- 線引き採点
- 重要カード分類採点
- 設問番号選択
- 答案例・解説・キーワード表示
- 80分タイマー
- 未着手から選択
- ランダム出題
- 演習履歴ダッシュボード
- 間違いノート
- 記録JSONのエクスポート・インポート

## フォルダ

```text
shindanshi_html_app/
  index.html
  materials/
    manifest.json
    materials_bundle.json
    jirei3_trial_001.json
    jirei1_3500_001.json
  records/
    .gitkeep
  tools/
    material_generation_prompt.md
    generate_seed_materials.py
    update_manifest.py
```

## 記録について

静的HTMLだけでは、GitHub上の `records` フォルダへ自動保存できません。

このアプリの記録は次の2段構えです。

- 通常時: ブラウザの `localStorage` に自動保存
- 保管時: 「記録JSONをダウンロード」で手元に保存

ダウンロードした記録JSONをGitHubに残したい場合は、手動で `records` フォルダへ追加してcommitしてください。

## 教材を増やす

標準では、`materials_bundle.json` に事例I〜IIIの教材をまとめます。`index.html` はまずこのbundleを直接読み込み、失敗した場合のみ `manifest.json` にフォールバックします。

同梱の30本セットを作り直す場合は、次を実行します。

```bash
python3 tools/generate_seed_materials.py
python3 tools/update_manifest.py
```

個別教材JSONを `materials` に置く運用に戻す場合は、`materials_bundle.json` を別名に退避したうえで、次を実行すると `manifest.json` を個別教材一覧に更新できます。

```bash
python3 tools/update_manifest.py
```

夜に生成AIで教材を量産する場合は、`tools/material_generation_prompt.md` のプロンプトを使い、出力されたJSONを `materials` に保存してください。
