/**
 * backend/src/application/ports/supabase.repository.ts
 *
 * ヘルスチェック機能用リポジトリインターフェース
 */
import type { HealthCheckResult } from '../../domain/health-check.vo';

export interface IHealthRepository {
    /**
     * Supabase の接続状態を確認します。
     * @returns ヘルスチェック結果
     */
    checkConnection(): Promise<HealthCheckResult>;
}

export interface HealthSupabaseRepositoryPort {
    /**
     * Supabase の接続状態を確認します。
     * @returns ヘルスチェック結果
     */
    checkConnection(): Promise<HealthCheckResult>;
}
