
import { HealthSupabaseRepository } from '../infrastructure/health-supabase.repository';
import { CheckHealthUseCase } from '../application/check-health.usecase';
import { HealthController } from '../interface/health.controller';

/**
 * Health機能のコンポーネントを組み立てるファクトリです。
 * 依存関係の注入（DI）を一手に引き受けます。
 */
export class HealthFactory {
    /**
     * HealthController を生成します。
     * 
     * @param url - Supabase URL
     * @param anonKey - Supabase Anon Key
     * @returns 組み立て済みの HealthController
     */
    static createController(url: string, anonKey: string): HealthController {
        const repository = new HealthSupabaseRepository(globalThis.fetch, url, anonKey);
        const useCase = new CheckHealthUseCase(repository);
        return new HealthController(useCase);
    }
}
