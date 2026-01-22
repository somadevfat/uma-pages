# 憲法

以下は憲法です。破れば死刑。

# 言語

- 日本語で回答。
- コメントは日本語。

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
   - 全関数にJSDoc（@param, @returns等）を記述し、役割を明記する。
   - 命名で表現しきれない「ビジネス背景」や「実装意図」がある場合のみ、インラインコメント（//）で補足する。
7. **Type Safety**: anyを禁止し、正確な型定義を行う。Union型やType Guardを活用してランタイムエラーを防ぐ。

### Test Quality Standards (Visual AAA)

1. **Visual AAA Pattern**: 以下の記号を用いてセクションを分け、各間には必ず「1行の空行」を設けること。
   - `// --- Arrange`: 前提条件の準備（Mock設定、データ作成）。
   - `// --- Act`: テスト対象の実行。原則として1行で記述する。
   - `// --- Assert`: 結果の検証。
2. **Behavior Testing**: 実装の詳細（内部変数等）ではなく、入力に対する出力（振る舞い）をテストすること。
3. **Framework**: テストは原則として Vitest を使用すること。

## Constraints

- **解説**: コード修正時は、上記鉄則に基づくリファクタリング理由を論理的に解説すること。
- **品質**: 出力コードには必ずJSDoc、自己説明的な命名、および上記ルールに則ったAAAテストを含めること。

# ソフトウェア設計原則 まとめ

## 基本・マインドセット

- **DRY** (Don't Repeat Yourself)
  同じ知識やロジックを重複させない（二度手間禁止）。
- **KISS** (Keep It Simple, Stupid)
  常にシンプルさを保つ。複雑にしない。
- **YAGNI** (You Ain't Gonna Need It)
  先回りして機能を作らない。今必要なものだけ作る。
- **PIE** (Program Intently and Expressively)
  意図が明確で表現力豊かな、読みやすいコードを書く。
- **ボーイスカウト規則** (Boy Scout Rule)
  コードを触ったら、触る前よりも少しだけ綺麗にしてから帰る。

## SOLID原則

- **SRP** (Single Responsibility Principle) - 単一責任の原則
  一つのクラスやモジュールは、一つの役割（変更の理由）だけを持つ。
- **OCP** (Open-Closed Principle) - 開放閉鎖の原則
  機能の追加（拡張）はしやすく、既存のコードの修正は不要にする。
- **LSP** (Liskov Substitution Principle) - リスコフの置換原則
  親クラスを子クラスに置き換えても、プログラムが正しく動作し続けるようにする。
- **ISP** (Interface Segregation Principle) - インターフェース分離の原則
  使わないメソッドを強制されるような巨大なインターフェースを作らない。
- **DIP** (Dependency Inversion Principle) - 依存性逆転の原則
  上位モジュールが下位の具体的な実装に依存せず、抽象（インターフェース）に依存するようにする。

## 構造・依存関係

- **SoC** (Separation of Concerns) - 関心の分離
  異なる機能や目的は、別々の部品に切り分ける。
- **LoD** (Law of Demeter) - デメテルの法則
  直接の関係がないオブジェクトの内部メソッドを呼び出さない（最小知識の原則）。
- **SLAP** (Single Level of Abstraction Principle) - 抽象化レベルの統一
  一つの関数内では、コードの抽象度（粒度）を一定に揃える。
- **疎結合 / 高凝集** (Loose Coupling / High Cohesion)
  部品同士の繋がりは弱くし、部品内部の機能的なまとまりは強くする。
- **継承より委譲** (Composition Over Inheritance)
  クラスを継承するのではなく、他のクラスをフィールドとして持つことで機能を利用する。

## その他

- **最小驚きの原則** (Principle of Least Astonishment)
  他の開発者が予想する通りに動くように設計し、意外な挙動をさせない。
- **時期尚早な最適化の回避** (Avoid Premature Optimization)
  ボトルネックが判明する前に、推測だけで複雑な高速化を行わない。
