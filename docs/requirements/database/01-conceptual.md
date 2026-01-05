# DB設計（概念設計）

対象: 個人ブログの「お問い合わせ」管理（管理画面あり）
作成日: 2025-12-27

## 1. 目的・スコープ
- 公開サイトの Contact フォームからの問い合わせを **永続化** する
- 管理画面で **一覧/詳細閲覧**、**既読/未読** 更新ができる
- スパム/不正送信を抑制しつつ、運用負荷を増やしすぎない

> 記事（Markdown）はDB管理しない（Git管理）。本DBは問い合わせと管理画面認証に限定。

---

## 2. 概念エンティティ（ERの粒度）

### 2.1 ContactMessage（問い合わせ）
**説明**: ユーザーがフォームから送信したメッセージ本体。
- 属性（概念）
  - messageId
  - name（任意）
  - email
  - subject（任意）
  - body
  - status（unread / read）
  - createdAt
  - updatedAt
  - source（送信元情報：任意）

### 2.2 AdminIdentity（管理者の識別子：Entra ID）
**説明**: 管理画面の管理者を「DBユーザー」ではなく **Entra ID のID（JWTクレーム）** で識別する。
- 属性（概念）
  - tenantId（`tid`）
  - objectId（`oid`）※推奨（メール変更の影響を受けにくい）
  - （任意）preferredUsername（`preferred_username`）

> 1人運用のため、DBに admin_users/admin_sessions は持たず「JWT検証 + allowlist（tid/oid）」で認可する。

### 2.3 AbuseLog（不正対策ログ：任意）
**説明**: スパム/連投などを追跡するための最小ログ（必要になってから導入）。

---

## 3. エンティティ間の関係
- ContactMessage は AdminIdentity と直接リレーションを持たない（「誰が既読にしたか」まで要らない前提）
  - 将来「対応担当」「対応履歴」が必要になれば、更新者の `oid` を保持する設計に拡張可能

---

## 4. 業務ルール（概念）
- ContactMessage
  - 作成時 status=unread
  - status は unread/read の2値で開始（将来: archived/spam 等拡張可能）
- 重複送信対策
  - 同一IP/同一メール/同一本文の短時間連投を抑止（アプリ層で実装）
- 個人情報（PII）
  - email/body は機密度高。DBアクセス権限/ログ出力範囲を最小化
  - 保存期間（要件未確定）：当面は無期限、運用開始後に見直し可能

---

## 5. 主なユースケース（DB観点）
- 公開フォーム送信
  1) ContactMessage をINSERT
  2) 管理者が管理画面で新着件数を確認
- 管理画面
  - 一覧: status=unread を優先表示、createdAt desc
  - 詳細: messageIdで取得
  - 更新: statusをreadに変更
