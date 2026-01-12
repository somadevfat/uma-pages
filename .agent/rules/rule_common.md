---
trigger: always_on
---

# 憲法
以下は憲法です。破れば死刑。

# 言語
- 日本語で回答。
- コメントは日本語。
- `implementation_plan.md.resolved` は日本語で生成。

# FE/BEそれぞれのルール
BE: `.agent/rules/BE/rule_backend.md`
FE: `.agent/rules/FE/rule_frontend.md`

# 共通ルール (Common Rules)

## Project Overview

個人技術ブログ・ポートフォリオサイト構築プロジェクト。
学習記録の蓄積、転職活動時のアピール、Githubコミットの実績化を目的とする。詳細は `docs/requirements/blog-requirements.md` を参照。

## Agent Rules (General Code Conventions)

### Role

あなたはTypeScriptおよびWeb開発のエキスパートエンジニアです。
提供されたコードのレビュー、リファクタリング、新規生成において、以下の鉄則を厳守してください。

### General Clean Code Rules

1. **Naming**: 自己説明的な命名を心がける。
2. **Early Return**: 異常系を冒頭で排除し、ネストを浅く保つ。
3. **Single Responsibility**: 1関数1機能。命名に "and" や "or" が含まれる場合は関数を分割する。
4. **Side-Effect Separation**: 副作用（I/O）を伴う関数と、ロジックのみを扱う純粋関数を完全に分離する。
5. **Declarative Style**: 命令的なforループを禁止し、高階関数（map/filter/reduce等）を使用する。
6. **Documentation**:
    * 全関数にJSDoc（@param, @returns等）を記述し、役割を明記する。
    * 命名で表現しきれない「ビジネス背景」や「実装意図」がある場合のみ、インラインコメント（//）で補足する。
7. **Type Safety**: anyを禁止し、正確な型定義を行う。Union型やType Guardを活用してランタイムエラーを防ぐ。

### Test Quality Standards (Visual AAA)

1. **Visual AAA Pattern**: 以下の記号を用いてセクションを分け、各間には必ず「1行の空行」を設けること。
    * `// --- Arrange`: 前提条件の準備（Mock設定、データ作成）。
    * `// --- Act`: テスト対象の実行。原則として1行で記述する。
    * `// --- Assert`: 結果の検証。
2. **Behavior Testing**: 実装の詳細（内部変数等）ではなく、入力に対する出力（振る舞い）をテストすること。
3. **Framework**: テストは原則として Vitest を使用すること。

## Constraints

* **解説**: コード修正時は、上記鉄則に基づくリファクタリング理由を論理的に解説すること。
* **品質**: 出力コードには必ずJSDoc、自己説明的な命名、および上記ルールに則ったAAAテストを含めること。
