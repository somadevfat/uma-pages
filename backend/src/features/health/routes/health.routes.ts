
import { Hono } from 'hono';
import { HealthFactory } from '../di/health.factory';

/**
 * Hono の環境変数定義
 */
type Bindings = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
};

/**
 * Health機能のルーティングを定義します。
 * 依存関係の解決は HealthFactory に委譲します。
 */
export const createHealthRouter = () => {
    const app = new Hono<{ Bindings: Bindings }>();

    app.get('/dbcheck', async (c) => {
        // 1. 環境変数の取得と検証
        const url = c.env.SUPABASE_URL?.trim();
        const anonKey = c.env.SUPABASE_ANON_KEY?.trim();

        if (!url) return c.json({ ok: false, error: 'SUPABASE_URL is missing' }, 500);
        if (!anonKey) return c.json({ ok: false, error: 'SUPABASE_ANON_KEY is missing' }, 500);

        // 2. Factory を使用してコントローラーを取得
        const controller = HealthFactory.createController(url, anonKey);

        // 3. コントローラーに処理を委譲
        return controller.getHealth(c);
    });

    return app;
};
