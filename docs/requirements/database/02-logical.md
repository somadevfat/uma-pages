# DB設計（論理設計）

対象: 個人ブログの「お問い合わせ」管理（管理画面あり）
作成日: 2025-12-27

推奨DB: PostgreSQL（マネージド: Supabase/Neon等）
関連ドキュメント: `docs/requirements/database/03-physical.md`

---

## 1. テーブル定義（案）

### 1.1 contacts（問い合わせ）
| カラム | 型（例） | NULL | 説明 |
|---|---:|:---:|---|
| id | uuid | NO | 主キー |
| name | text | YES | 送信者名 |
| email | text | NO | 返信先メール |
| subject | text | YES | 件名 |
| message | text | NO | 本文 |
| status | text | NO | `unread` / `read` |
| created_at | timestamptz | NO | 作成日時 |
| updated_at | timestamptz | NO | 更新日時 |
| ip_hash | text | YES | IPをそのまま保存せずハッシュ化（任意） |
| user_agent | text | YES | UA（任意、長いので要注意） |

制約（案）
- `status IN ('unread','read')`
- `email` は最低限の形式チェック（アプリ層）＋必要ならDBでもチェック

インデックス（案）
- `(status, created_at desc)`：未読一覧の高速化
- `(created_at desc)`：全件一覧


---

## 2. 認証・認可（MSAL / Entra ID）
- フロント（Next.js）: MSALでログインし **JWT（access token）** を取得
- バックエンド（Hono）: MSALは使わず、受け取ったJWTを検証して保護APIを許可する

バックエンド検証項目（必須）
- 署名検証: Entra ID の JWKS で検証
- クレーム検証: `iss` / `aud` / `exp`
- テナント固定: `tid` が想定テナントであること
- 管理者判定（1人運用）: `oid` を allowlist で一致判定（推奨）

必要な設定値（例）
- TENANT_ID（= tid）
- CLIENT_ID（API側の Application ID URI / aud に対応）
- ADMIN_OID（管理者の object id）

---

## 3. データライフサイクル
- contacts
  - 削除要件は未確定（当面保持）
  - 将来: 保持期限（例: 1年）や匿名化を導入可能

---

## 4. アクセス制御・運用
- DB接続情報はサーバ側（Hono/Next API）でのみ保持
- 管理画面APIは **JWT必須**（Bearer）かつ `ADMIN_OID` による認可必須
- ログに問い合わせ本文を出さない（デバッグ時もマスク）

---

## 5. 次の確定事項（質問）
1) 管理者の固定方法はどれにしますか？（1人運用）
   - A: `oid` allowlist（推奨）
   - B: `preferred_username`（メール）一致（メール変更で壊れやすい）
2) 問い合わせの「削除/アーカイブ」は必要ですか？（最初は不要でもOK）
