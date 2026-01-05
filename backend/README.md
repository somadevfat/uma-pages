# Cloudflare Workers Backend (Hono + Supabase)

This `backend/` is a Cloudflare Workers project managed by Wrangler.
It exposes a minimal `/dbcheck` endpoint to verify Supabase connectivity.

## Requirements

- Node.js (LTS recommended)

## Quickstart

From this `backend/` directory:

1) Install dependencies

- `npm ci`

2) Set local environment variables for Wrangler

Wrangler dev typically reads `.dev.vars` for local variables.

- Create `backend/.dev.vars` with at least:
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
- Optional:
   - `DBCHECK_TABLE=your_existing_table`

Notes:

- Do NOT use the Supabase **service role key** in a public Worker.
- If you already maintain a `backend/.env`, copy only the needed values into `.dev.vars`.

3) Start dev server

- `npm run dev`

Wrangler prints the local URL (usually `http://localhost:8787`).

## Endpoints

### `GET /dbcheck`

Checks Supabase by running a simple select against a table.

- Uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Uses `DBCHECK_TABLE` (defaults to `countries`)

If you see an error like:

`Could not find the table 'public.countries' in the schema cache`

it means Supabase is reachable but the target table does not exist.
Set `DBCHECK_TABLE` to an existing table name, or create the table in Supabase.

## Deploy

For production, prefer Wrangler secrets rather than committing vars.

- `wrangler secret put SUPABASE_URL`
- `wrangler secret put SUPABASE_ANON_KEY`

Then:

- `npm run deploy`

## Auth middleware (optional)

`src/middleware/auth.middleware.ts` contains a cookie-aware Supabase server client setup.
It is not required for `/dbcheck` and is only useful if you build routes that need auth/session.

---

# 日本語

この `backend/` は Cloudflare Workers（Wrangler）用のプロジェクトです。
Supabase への疎通確認として `/dbcheck` を用意しています。

## 前提

- Node.js（LTS推奨）

## 起動方法

`backend/` で実行してください。

1) 依存関係のインストール

- `npm ci`

2) 環境変数（ローカル）

Wrangler のローカル実行では `.dev.vars` を使うのが簡単です。

- `backend/.dev.vars` を作成して、最低限これを設定してください:
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
- 任意:
   - `DBCHECK_TABLE=既存のテーブル名`

注意:

- Supabase の **service role key** は入れないでください（漏洩リスクが高いです）
- すでに `backend/.env` を使っている場合は、必要な値だけを `.dev.vars` にコピーしてください

3) 開発サーバ起動

- `npm run dev`

## エンドポイント

### `GET /dbcheck`

指定テーブルを `select` して Supabase の疎通を確認します。

- `DBCHECK_TABLE` を未設定だと `countries` を参照します
- `countries` が無い場合は、存在するテーブル名を `DBCHECK_TABLE` に設定してください

## デプロイ

本番は Wrangler の secrets を使うのがおすすめです。

- `wrangler secret put SUPABASE_URL`
- `wrangler secret put SUPABASE_ANON_KEY`

その後:

- `npm run deploy`
