import { Hono } from 'hono';
import { createHealthRouter } from './features/health/routes/health.routes';

/**
 * Hono の環境変数定義
 */
type Bindings = {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Feature Routes
 * 各機能のComposition Rootを呼び出してマウントします。
 */
app.route('/', createHealthRouter());

export default app;
