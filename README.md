# イベントアルバム（スライドショー）

`photos/` の下にイベントごとのフォルダを作って画像を入れるだけで、
イベント単位のスライドショーとして見られる静的サイトです。

## フォルダ構成

```
photos/
  2026-04-05_お花見/
    001.jpg
    002.jpg
    cover.jpg      ← 任意。あれば一覧の表紙になる（なければ先頭の画像）
  2026-08-15_夏祭り/
    ...
  manifest.json    ← 自動生成（手で編集しない）
```

- フォルダ名の先頭に `YYYY-MM-DD_` を付けると日付として表示され、新しい順に並びます。
- 画像はファイル名順（`1, 2, 10` のような自然順）で再生されます。
- 対応形式: jpg / jpeg / png / gif / webp / avif / svg
- 同梱の `2026-04-05_お花見` と `2026-08-15_夏祭り` はサンプルなので、不要なら削除してください。

## 画像を追加したら

```sh
python3 scripts/build_manifest.py
```

`photos/manifest.json` が更新されます。

## ローカルで見る

```sh
python3 -m http.server 8000
# → http://localhost:8000/
```

（`index.html` を直接ダブルクリックで開くと、ブラウザの制限で manifest を読めません）

## 公開（GitHub Pages）

`main` ブランチに push すると `.github/workflows/pages.yml` が manifest を再生成して
GitHub Pages にデプロイします。初回はリポジトリの
**Settings → Pages → Source** を **GitHub Actions** にしてください。

## 操作

| 操作 | キー / ジェスチャ |
| --- | --- |
| 前 / 次の画像 | ← / →、左右スワイプ、画面端の ‹ › |
| 再生 / 一時停止 | Space |
| 全画面 | F |
| 一覧に戻る | Esc |

- 切り替え間隔は 2〜8 秒から選べます。
- `https://…/#2026-08-15_夏祭り` のように URL の `#フォルダ名` で特定イベントを直接開けます。
