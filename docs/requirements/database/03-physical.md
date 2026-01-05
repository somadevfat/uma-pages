# DB設計（物理設計 / PostgreSQL）

対象: 個人ブログの「お問い合わせ」管理
作成日: 2025-12-27
前提: PostgreSQL（Supabase/Neon 等のマネージドPostgres）

> 補足: **SupabaseのDBはPostgreSQL（= Postgres）です**（加えてAuth/Storage/Edge Functions等が付いたサービス）。

---

## 1. 物理設計方針
- スキーマは当面 `public` に作成（必要なら `app` スキーマへ分離）
- PKは `uuid`（`gen_random_uuid()`）
- `updated_at` はトリガで自動更新
- `status` は当面 `unread/read` の2値（CHECK制約）

---

## 2. DDL（SQL）

### 2.1 前提拡張
```sql
create extension if not exists pgcrypto;
```

### 2.2 contacts テーブル
```sql
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),

  name text null,
  email text not null,
  subject text null,
  message text not null,

  status text not null default 'unread',

  ip_hash text null,
  user_agent text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contacts_status_check check (status in ('unread','read'))
);
```

### 2.3 updated_at 自動更新トリガ
```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contacts_set_updated_at on public.contacts;

create trigger trg_contacts_set_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();
```

### 2.4 インデックス
```sql
create index if not exists idx_contacts_status_created_at
  on public.contacts (status, created_at desc);

create index if not exists idx_contacts_created_at
  on public.contacts (created_at desc);
```

---

## 3. Supabase運用時の推奨（RLS）

Supabaseを使う場合、原則RLS（Row Level Security）を有効化し、
- 公開フォーム送信（INSERT）のみ許可
- 管理画面（SELECT/UPDATE）はJWT（管理者）経由のAPIのみ
に寄せるのが安全です。

ただし今回は **Hono側でJWT検証 + ADMIN_OID認可** を前提にしているため、RLSは「後から強化」でもOKです。

---

## 4. マイグレーション運用（推奨）
- DDLはファイル管理し、環境ごとに適用（dev/stg/prod）
- 変更は `ALTER TABLE` で追記し、破壊的変更は段階的に行う

---

## 5. 確定事項・次ステップ
- `contacts.email` は **必須（NOT NULL）** で確定
- 次ステップ: 問い合わせ削除は不要で開始でOK？（必要なら `archived` や `deleted_at` 追加）
