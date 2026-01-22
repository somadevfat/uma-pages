/**
 * backend/src/domain/health/health-check.vo.ts
 *
 * ヘルスチェックの結果を表す Value Object (型定義) です。
 * ドメイン層は他の層に依存せず、純粋な TypeScript で記述されます。
 */

/**
 * ヘルスチェックの結果
 */
export type HealthCheckResult =
    | { ok: true; auth: { status: number }; rest: { status: number } }
    | { ok: false; target: 'auth' | 'rest'; status: number; body: string };
