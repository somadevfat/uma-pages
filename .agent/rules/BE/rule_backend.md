---
trigger: manual
---

# バックエンドルール (Backend Rules)

## Architecture & Tech Stack

* **Framework**: Hono
* **Runtime**: Cloudflare Workers
* **Database**: Supabase (PostgreSQL)
* **Auth**: MSAL (Admin only)
* **Architecture**: **Modular Monolith (Package by Feature) based on Clean Architecture + DDD**

## Directory Structure Strategy

バックエンド（`src/features` 等）は、技術的なレイヤーではなく、**ビジネス機能（Feature）** を最上位のディレクトリとして分割する。
各Featureディレクトリの内部で、Clean Architectureのレイヤー構造を適用する。

* **Structure Example**:
```text
src/
├── features/                  # 機能単位のルート
│   ├── articles/              # 例: 記事管理機能
│   │   ├── domain/            # Entities, Value Objects (Pure TS)
│   │   ├── application/       # Use Cases, Repository Interfaces
│   │   ├── infrastructure/    # Repository Impl (Supabase), Query Services
│   │   ├── interface/         # Controllers, DTOs
│   │   ├── di/                # Dependency Injection (Factories)
│   │   │   └── articles.factory.ts
│   │   └── routes/            # Routing Definitions
│   │       └── articles.routes.ts
│   └── tags/                  # 例: タグ管理機能
│       └── ...
├── shared/                    # 全機能共通の部品
│   ├── domain/                # 共通のValue Object (例: ID, Email)
│   ├── infrastructure/        # DB接続設定, 共通Middleware
│   └── utils/                 # 日付操作, ロガーなど
└── index.ts                   # エントリポイント (各Featureのroutesをマウント)
```

### Layers Definition

各Feature内で以下のレイヤー責務を厳守すること。

* **Domain Layer** (`domain`):
    * 外部依存ゼロ（Pure TypeScript）。
    * ビジネスルール、Entity、Value Object、Domain Serviceを配置。

* **Application Layer** (`application`):
    * ユースケースの実装。
    * Repository等のインターフェース（Port）定義。
    * トランザクション管理などのアプリケーションロジック。

* **Interface Layer** (`interface`):
    * コントローラー、DTO、レスポンスの整形。
    * ※HonoのContextに依存してよいのはこのレイヤーまで。

* **Infrastructure Layer** (`infrastructure`):
    * Repositoryの実装（Supabase/KVへのアクセス）。
    * 外部APIクライアントの実装。

* **DI Layer** (`di`):
    * **Composition Root**。
    * 環境変数の検証と、各レイヤーのインスタンス化（組み立て）を担当する。
    * 外部から必要な依存（env等）を受け取り、完成したコントローラー等を返す。

* **Routes Layer** (`routes`):
    * ルーティングの定義のみを担当する。
    * DI Layer を呼び出してコントローラーを取得し、各エンドポイントにマウントする。

## Development Workflow

### Build & Run

* **Dev**: `npm run dev` (`wrangler dev`)
* **Deploy**: `npm run deploy` (`wrangler deploy`)
* **Typegen**: `npm run cf-typegen` (`wrangler types`)

### Testing

* **Unit Test**: `npm test` (`vitest run`)
    *   **対象**: Domain, Application, Interface, Shared Utils
    *   **方針**: 外部依存（DB/API）は全てモック。カバレッジ 100% 必須。
*   **Repository Test**: `npm run test:repo` (予定)
    *   **対象**: Infrastructure (Repositories)
    *   **方針**: **実DB（Supabase）を使用**。スキーマを分離（例: `test` スキーマ）して実行。モック禁止。
*   **Framework**: Vitest + `@cloudflare/vitest-pool-workers`

## Backend Specific Rules (Clean Architecture / DDD)

1.  **Feature Packaging**: コードは原則として `src/features/{feature_name}/` 配下に配置し、機能単位での凝集度を高めること。
2.  **DI (Dependency Injection)**: 外部依存（API/DB/env/Date/Math.random等）は直接参照せず、引数またはコンストラクタから注入する設計にする。
3.  **Domain Purity**: Domain Layer は他のLayerに依存してはならない。外部ライブラリの使用も極力避ける。
4.  **Dependency Rule**: 依存の方向は常に 外側(Infra -> Interface -> App) -> 内側(Domain) に向かうこと。Feature間の依存は最小限にし、循環参照を避ける。
5.  **Test Coverage (Unit)**: **Infrastructure層以外** の全ての分岐（if/else等）を網羅し、カバレッジ100%を達成すること。Infrastructure層は実機テストで品質を担保するため、カバレッジ計測からは除外してよい。
6.  **Cloudflare Workers Specific**: `@cloudflare/vitest-pool-workers` を前提とし、env（KV/D1等）を適切にモックすること。
7. **Entry Point Separation**: 各Featureはルーティングを担当する `routes/` と、依存解決を担当する `di/` (Composition Root) を分離すること。`index.ts` は機能ごとの `routes` をマウントする役割のみを担う。
