---
trigger: manual
---

# フロントエンドルール (Frontend Rules)

## Architecture & Tech Stack

* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS (Utility-first)
* **State Management**: React Hooks, Context API, URL Search Params (Nuqs recommended)
* **Deployment**: Cloudflare Pages / Vercel

## Directory Structure Strategy (Feature-Sliced Design Inspired)

フロントエンドもバックエンド同様、**機能（Feature）** を軸に分割し、コロケーション（Co-location）を徹底する。

* **Structure Example**:
```text
src/
├── app/                       # Routing (Pages, Layouts)
│   ├── (public)/              # Route Groups
│   ├── dashboard/
│   │   └── page.tsx           # Page Component (RSC)
│   └── layout.tsx             # Root Layout
├── components/                # Shared UI Components (Design System)
│   ├── ui/                    # Primitive UI (Button, Input) - shadcn/ui like
│   └── layouts/               # Global Layout components (Header, Footer)
├── features/                  # Business Logic & Feature Components
│   ├── articles/              # Example Feature
│   │   ├── components/        # Feature-specific UI
│   │   ├── hooks/             # Custom Hooks
│   │   ├── api/               # API Calls (Server Actions / Fetch)
│   │   └── types/             # Feature types
│   └── auth/
├── lib/                       # Utility Functions, Constants
└── styles/                    # Global Styles (globals.css)
```

## Component Architecture & Design Patterns

Next.js App Router の特性を最大限活かすため、以下のコンポーネント設計指針を厳守すること。

### 1. Server Components (RSC) - The Default
* **原則**: 基本的にすべてのコンポーネントは **Server Component** として作成する。
* **責務**:
    * データ取得（DBアクセス, Fetch）。
    * センシティブな情報（API Key等）の処理。
    * 重いレンダリング処理の実行。
    * メタデータ（SEO）の生成。
* **禁止事項**: `useState`, `useEffect`, ブラウザAPI (`window`等), Event Handlers (`onClick`等) の使用。

### 2. Client Components (CC)
* **宣言**: ファイル先頭に `'use client'` を記述する。
* **責務**:
    * ユーザーインタラクション（クリック、入力等）。
    * ブラウザAPIの使用（LocalStorage, IntersectionObserver等）。
    * React Hooks (`useState`, `useEffect`, Custom Hooks) の使用。
* **最適化**: ツリーの末端（Leaf nodes）に配置し、JavaScriptバンドルサイズを最小限に抑えること。

### 3. "Donut Pattern" (Composition Pattern)
「ドーナツパターン」とは、**Server Component (RSC) の中に Client Component (CC) を配置し、さらにその『穴（children）』の中に Server Component を戻し入れる構造** を指す。

このパターンを使用することで、**CC配下でもRSCのメリット（データフェッチ済みの静的コンテンツ等）を維持できる**。

* **Bad Pattern (CCがRSCを直接インポート)**:
  CCの中にRSCを直接importして配置すると、そのRSCもCCの一部（クライアントバンドル）として扱われてしまい、サーバーサイドでの実行メリットが失われる場合がある（またはエラーになる）。

* **Good Pattern (Donut / Children)**:
  CCは `children` prop を受け取り、親（Pageなど）がそこでRSCを渡す。

```tsx
// 1. Client Component (The Donut)
// wrapper-cc.tsx
'use client';

export function WrapperCC({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  return (
    <div className="border p-4">
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {/* 2. The Hole (Server Content goes here) */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

// 3. Server Component (The Page)
// page.tsx (RSC)
import { WrapperCC } from './wrapper-cc';
import { AsyncDataComponent } from './async-data-rsc';

export default async function Page() {
  return (
    <WrapperCC>
      {/* 4. Filling the hole with RSC */}
      <AsyncDataComponent />
    </WrapperCC>
  );
}
```

## State Management Rules

1. **URL as a Source of Truth**:
   * フィルター条件、検索クエリ、ページネーション番号など、永続化すべき状態は必ず **URL Search Params** で管理する。
   * リロードしても状態が維持され、共有可能にするため。
2. **Server State**:
   * APIから取得したデータは、これらをクライアントステート（`useEffect` での fetch + `useState`）で管理しない。
   * **RSCで直接取得** するか、クライアント側が必要な場合は **TanStack Query** 等のライブラリ、または **Server Actions** を使用する。
3. **Client State**:
   * UIの一時的な状態（モーダルの開閉、フォームの入力中データ）のみ `useState` / `useReducer` で管理する。

## Styling Guidelines (Tailwind CSS)

* **Mobile First**: デフォルトはモバイル向けスタイル。`md:`, `lg:` でレスポンシブ対応を行う。
* **Utility First**: 恣意的なCSSファイル（`styles.module.css`等）作成は避け、TailwindのUtility Classで完結させる。
* **Class Ordering**: `prettier-plugin-tailwindcss` 等による自動並び替えを推奨。
* **Components**: 共通UI（Button, Card等）は `components/ui` に定義し、`className` propを受け取ってマージできるようにする（`clsx` / `tailwind-merge` 利用）。

## Accessibility (a11y) & SEO

* **Semantic HTML**: `div` だけでなく、`main`, `section`, `article`, `nav`, `aside` 等のセマンティックタグを適切に使用する。
* **Interactive Elements**: ボタンには `button` タグを使い、`div onClick` は避ける。キーボード操作 (`Tab`, `Enter`) が可能であることを確認する。
* **Images**: `next/image` を使用し、必ず `alt` 属性を記述する。レイアウトシフト（CLS）を防ぐため、サイズを指定するか `fill` を適切に使う。

## Testing

* **Unit Testing**: `Vitest` + `React Testing Library`.
* **Focus**: UIの見た目ではなく、**振る舞い（ユーザーインタラクション）** と **アクセシビリティ（Role, Label）** をテストする。
