import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseMiddleware, getSupabase } from '../../../../src/shared/infrastructure/middleware/auth.middleware';
import * as ssr from '@supabase/ssr';
import * as honoCookie from 'hono/cookie';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
    parseCookieHeader: vi.fn(),
}));

vi.mock('hono/cookie', () => ({
    setCookie: vi.fn(),
}));

describe('auth.middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('supabaseMiddleware', () => {
        it('環境変数が不足している場合、エラーをスローする', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: {},
                req: { header: () => '' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();

            // --- Act
            const promise = middleware(c, next);

            // --- Assert
            await expect(promise).rejects.toThrow('Supabase URL is missing');
        });

        it('Anon Key が不足している場合、エラーをスローする', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'http://test' },
                req: { header: () => '' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();

            // --- Act
            const promise = middleware(c, next);

            // --- Assert
            await expect(promise).rejects.toThrow('Supabase anon key is missing');
        });

        it('正常な環境変数の場合、Supabase クライアントを作成し Context にセットする', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'http://test', SUPABASE_ANON_KEY: 'key' },
                req: { header: () => 'cookie=val' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            const mockClient = { auth: {} };
            vi.mocked(ssr.createServerClient).mockReturnValue(mockClient as any);

            // --- Act
            await middleware(c, next);

            // --- Assert
            expect(ssr.createServerClient).toHaveBeenCalledWith(
                'http://test',
                'key',
                expect.any(Object)
            );
            expect(c.set).toHaveBeenCalledWith('supabase', mockClient);
            expect(next).toHaveBeenCalled();
        });

        it('VITE_ 接頭辞付きの環境変数も認識する', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { VITE_SUPABASE_URL: 'http://vite', VITE_SUPABASE_ANON_KEY: 'vitekey' },
                req: { header: () => '' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            vi.mocked(ssr.createServerClient).mockReturnValue({} as any);

            // --- Act
            await middleware(c, next);

            // --- Assert
            expect(ssr.createServerClient).toHaveBeenCalledWith('http://vite', 'vitekey', expect.any(Object));
        });

        it('cookies.getAll がクッキーを正しく解析する', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'u', SUPABASE_ANON_KEY: 'k' },
                req: { header: vi.fn().mockReturnValue('a=1; b=2') },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            vi.mocked(ssr.createServerClient).mockReturnValue({} as any);
            vi.mocked(ssr.parseCookieHeader).mockReturnValue([
                { name: 'a', value: '1' },
                { name: 'b', value: '2' },
                { name: 'c', value: undefined }
            ]);

            // --- Act
            await middleware(c, next);

            // --- Assert
            const callArgs = vi.mocked(ssr.createServerClient).mock.calls[0];
            const cookieOptions = callArgs[2] as any;
            const result = cookieOptions.cookies.getAll();
            expect(result).toEqual([{ name: 'a', value: '1' }, { name: 'b', value: '2' }]);
        });

        it('Cookie ヘッダーが欠落している場合、空文字列として解析される', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'u', SUPABASE_ANON_KEY: 'k' },
                req: { header: vi.fn().mockReturnValue(undefined) },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            vi.mocked(ssr.createServerClient).mockReturnValue({} as any);

            // --- Act
            await middleware(c, next);

            // --- Assert
            const callArgs = vi.mocked(ssr.createServerClient).mock.calls[0];
            const cookieOptions = callArgs[2] as any;
            const result = cookieOptions.cookies.getAll();
            expect(ssr.parseCookieHeader).toHaveBeenCalledWith('');
        });

        it('有効なクッキーがない場合、cookies.getAll は null を返す', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'u', SUPABASE_ANON_KEY: 'k' },
                req: { header: () => 'c=val' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            vi.mocked(ssr.createServerClient).mockReturnValue({} as any);
            vi.mocked(ssr.parseCookieHeader).mockReturnValue([{ name: 'c', value: undefined }]);

            // --- Act
            await middleware(c, next);

            // --- Assert
            const callArgs = vi.mocked(ssr.createServerClient).mock.calls[0];
            const cookieOptions = callArgs[2] as any;
            const result = cookieOptions.cookies.getAll();
            expect(result).toBeNull();
        });

        it('cookies.setAll が正しく setCookie を呼ぶ (各種オプション変換含む)', async () => {
            // --- Arrange
            const middleware = supabaseMiddleware();
            const c = {
                env: { SUPABASE_URL: 'u', SUPABASE_ANON_KEY: 'k' },
                req: { header: () => '' },
                set: vi.fn(),
            } as any;
            const next = vi.fn();
            vi.mocked(ssr.createServerClient).mockReturnValue({} as any);
            await middleware(c, next);
            const callArgs = vi.mocked(ssr.createServerClient).mock.calls[0];
            const cookieOptions = callArgs[2] as any;
            const cookiesToSet = [
                {
                    name: 'foo',
                    value: 'bar',
                    options: {
                        sameSite: 'Lax',
                        priority: 'High',
                        partitioned: true,
                        maxAge: 100
                    }
                },
                {
                    name: 'baz',
                    value: 'qux',
                    options: {
                        sameSite: true,
                        priority: undefined
                    }
                },
                {
                    name: 'quux',
                    value: 'val',
                    options: {
                        sameSite: false
                    }
                }
            ];

            // --- Act
            cookieOptions.cookies.setAll(cookiesToSet);

            // --- Assert
            expect(honoCookie.setCookie).toHaveBeenNthCalledWith(1, c, 'foo', 'bar', {
                sameSite: 'Lax',
                priority: 'High',
                partitioned: true,
                secure: true,
                maxAge: 100,
                domain: undefined,
                expires: undefined,
                httpOnly: undefined,
                path: undefined,
            });
            expect(honoCookie.setCookie).toHaveBeenNthCalledWith(2, c, 'baz', 'qux', {
                sameSite: 'strict',
                priority: undefined,
                partitioned: undefined,
                secure: undefined,
                domain: undefined,
                expires: undefined,
                httpOnly: undefined,
                maxAge: undefined,
                path: undefined,
            });
            expect(honoCookie.setCookie).toHaveBeenNthCalledWith(3, c, 'quux', 'val', {
                sameSite: undefined,
                priority: undefined,
                partitioned: undefined,
                secure: undefined,
                domain: undefined,
                expires: undefined,
                httpOnly: undefined,
                maxAge: undefined,
                path: undefined,
            });
        });
    });

    describe('getSupabase', () => {
        it('Context から supabase を取得する', () => {
            // --- Arrange
            const mockClient = { id: 'client' };
            const c = {
                get: vi.fn().mockReturnValue(mockClient)
            } as any;

            // --- Act
            const result = getSupabase(c);

            // --- Assert
            expect(c.get).toHaveBeenCalledWith('supabase');
            expect(result).toBe(mockClient);
        });
    });
});
