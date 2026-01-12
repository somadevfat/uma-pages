import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, type MockedClass } from 'vitest';
import worker from '../src/index';
import { HealthController } from '../src/features/health/interface/health.controller';

// HealthController をモック
vi.mock('../src/features/health/interface/health.controller', () => {
	return {
		HealthController: vi.fn().mockImplementation(() => ({
			getHealth: vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
		})),
	};
});

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('GET /dbcheck', () => {
	it('SUPABASE_URL が欠落している場合、500 を返す', async () => {
		// --- Arrange
		const request = new IncomingRequest('http://example.com/dbcheck');
		// env is read-only in some environments, but here it's an object we pass.
		const testEnv = { ...env, SUPABASE_URL: '' };
		const ctx = createExecutionContext();

		// --- Act
		const response = await worker.fetch(request, testEnv, ctx);

		// --- Assert
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ ok: false, error: 'SUPABASE_URL is missing' });
	});

	it('SUPABASE_ANON_KEY が欠落している場合、500 を返す', async () => {
		// --- Arrange
		const request = new IncomingRequest('http://example.com/dbcheck');
		const testEnv = { ...env, SUPABASE_URL: 'val', SUPABASE_ANON_KEY: '' };
		const ctx = createExecutionContext();

		// --- Act
		const response = await worker.fetch(request, testEnv, ctx);

		// --- Assert
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ ok: false, error: 'SUPABASE_ANON_KEY is missing' });
	});

	it('正常な場合、Controller に委譲して結果を返す', async () => {
		// --- Arrange
		const request = new IncomingRequest('http://example.com/dbcheck');
		const testEnv = { ...env, SUPABASE_URL: 'http://test', SUPABASE_ANON_KEY: 'key' };
		const ctx = createExecutionContext();

		const mockGetHealth = vi.fn().mockResolvedValue(new Response(JSON.stringify({ mock: 'result' }), { status: 200 }));
		(HealthController as MockedClass<typeof HealthController>).mockImplementation(() => ({
			getHealth: mockGetHealth,
		} as any));

		// --- Act
		const response = await worker.fetch(request, testEnv, ctx);

		// --- Assert
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ mock: 'result' });

		// 呼び出し確認
		expect(HealthController).toHaveBeenCalledTimes(1);
		expect(mockGetHealth).toHaveBeenCalledTimes(1);
	});
});
