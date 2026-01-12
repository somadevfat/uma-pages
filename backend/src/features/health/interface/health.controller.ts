/**
 * backend/src/interface/controllers/health.controller.ts
 *
 * ヘルスチェックの HTTP リクエストを処理するコントローラーです。
 * Hono の Context に依存し、入力検証とレスポンス生成を担当します。
 */
import type { Context } from 'hono';
import type { CheckHealthUseCase } from '../application/check-health.usecase';

export class HealthController {
    /**
     * @param checkHealthUseCase - ヘルスチェックユースケース
     */
    constructor(private readonly checkHealthUseCase: CheckHealthUseCase) { }

    /**
     * ヘルスチェックを実行します。
     *
     * @param c - Hono Context
     * @returns JSON Response
     */
    async getHealth(c: Context) {
        // 1. ユースケースの実行
        const result = await this.checkHealthUseCase.execute();

        // 2. レスポンスの生成
        if (!result.ok) {
            return c.json(result, 500);
        }

        return c.json(result);
    }
}
