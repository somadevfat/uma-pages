/**
 * backend/src/features/health/application/check-health.usecase.ts
 *
 * ヘルスチェックのビジネスロジックを実行するユースケースです。
 * リポジトリインターフェースに依存し、具体的な実装には依存しません (DIP)。
 */
import type { HealthCheckResult } from '../domain/health-check.vo';
import type { HealthSupabaseRepositoryPort } from './ports/health.repository';

export class CheckHealthUseCase {
    /**
     * @param healthRepo - ヘルスチェックリポジトリ (Port)
     */
    constructor(private readonly healthRepo: HealthSupabaseRepositoryPort) { }

    /**
     * ヘルスチェックを実行します。
     *
     * @returns ヘルスチェック結果
     */
    async execute(): Promise<HealthCheckResult> {
        return this.healthRepo.checkConnection();
    }
}
