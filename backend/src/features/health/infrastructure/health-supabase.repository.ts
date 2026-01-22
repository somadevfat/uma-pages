/**
 * backend/src/features/health/infrastructure/health-supabase.repository.ts
 *
 * Supabase リポジトリの実装です。
 * 外部 API へのアクセス (fetch) を担当します。
 */
import type { IHealthRepositoryPort } from '../application/ports/health.repository';
import type { HealthCheckResult } from '../domain/health-check.vo';

export class HealthSupabaseRepository implements IHealthRepositoryPort {
    /**
     * @param fetchImpl - fetch 関数 (DI)
     * @param url - Supabase URL
     * @param anonKey - Supabase Anon Key
     */
    constructor(
        private readonly fetchImpl: typeof fetch,
        private readonly url: string,
        private readonly anonKey: string
    ) { }

    /**
     * 文字列を指定された最大長に切り詰めます。
     * @param value - 対象文字列
     * @param max - 最大長
     * @returns 切り詰められた文字列
     */
    private truncate(value: string, max = 500): string {
        return value.slice(0, max);
    }

    /**
     * fetch を実行し、テキストボディを返します。
     * @param url - URL
     * @param headers - ヘッダー
     * @returns レスポンスとボディ
     */
    private async fetchAsText(url: string, headers: HeadersInit): Promise<{ res: Response; body: string }> {
        const res = await this.fetchImpl(url, { headers });
        const body = await res.text();
        return { res, body };
    }

    /**
     * Supabase の接続状態を確認します。
     * @returns ヘルスチェック結果
     */
    async checkConnection(): Promise<HealthCheckResult> {
        const headers = {
            apikey: this.anonKey,
            Authorization: `Bearer ${this.anonKey}`,
        };

        // 1. Auth サービスのチェック
        const authUrl = new URL('/auth/v1/health', this.url).toString();
        const { res: authRes, body: authBody } = await this.fetchAsText(authUrl, headers);

        if (!authRes.ok) {
            return {
                ok: false,
                target: 'auth',
                status: authRes.status,
                body: this.truncate(authBody),
            };
        }

        // 2. REST サービスのチェック
        const restUrl = new URL('/rest/v1/', this.url).toString();
        const { res: restRes, body: restBody } = await this.fetchAsText(restUrl, headers);

        if (restRes.status >= 500) {
            return {
                ok: false,
                target: 'rest',
                status: restRes.status,
                body: this.truncate(restBody),
            };
        }

        return {
            ok: true,
            auth: { status: authRes.status },
            rest: { status: restRes.status },
        };
    }
}
