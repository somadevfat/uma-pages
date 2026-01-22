import { type CookieOptions as SupabaseCookieOptions, createServerClient, parseCookieHeader } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Context, MiddlewareHandler } from 'hono';
import { env } from 'hono/adapter';
import { setCookie } from 'hono/cookie';
import type { CookieOptions as HonoCookieOptions } from 'hono/utils/cookie';

declare module 'hono' {
	interface ContextVariableMap {
		supabase: SupabaseClient;
	}
}

/**
 * Hono の Context から Supabase クライアントを取得します。
 *
 * @param c - Hono の Context
 * @returns SupabaseClient インスタンス
 */
export const getSupabase = (c: Context): SupabaseClient => {
	return c.get('supabase');
};

/**
 * Supabase 用の環境変数型
 */
type SupabaseEnv = {
	SUPABASE_URL?: string;
	SUPABASE_ANON_KEY?: string;
	SUPABASE_PUBLISHABLE_KEY?: string;
	VITE_SUPABASE_URL?: string;
	VITE_SUPABASE_ANON_KEY?: string;
};

/**
 * 解析済みのクッキー型
 */
type ParsedCookie = { name: string; value?: string };

/**
 * 設定対象のクッキー型
 */
type CookieToSet = {
	name: string;
	value: string;
	options: SupabaseCookieOptions;
};

/**
 * Supabase の 'sameSite' オプションを Hono の 'sameSite' オプションに変換します。
 *
 * @param sameSite - Supabase の sameSite オプション
 * @returns Hono の sameSite オプション
 */
const toHonoSameSite = (sameSite: SupabaseCookieOptions['sameSite']): HonoCookieOptions['sameSite'] | undefined => {
	if (sameSite === true) return 'strict';
	if (sameSite === false || sameSite === undefined) return undefined;
	return sameSite;
};

/**
 * Supabase のクッキーオプションを Hono のクッキーオプションに変換します。
 * 純粋なユーティリティ関数です。
 *
 * @param options - Supabase のクッキーオプション
 * @returns Hono のクッキーオプション
 */
const toHonoCookieOptions = (options: SupabaseCookieOptions): HonoCookieOptions => {
	const converted: HonoCookieOptions = {
		domain: options.domain,
		expires: options.expires,
		httpOnly: options.httpOnly,
		maxAge: options.maxAge,
		path: options.path,
		secure: options.secure,
		sameSite: toHonoSameSite(options.sameSite),
		partitioned: options.partitioned,
		priority: options.priority,
	};

	if (converted.partitioned === true) {
		converted.secure = true;
	}

	return converted;
};

/**
 * Supabase クライアントを初期化し、Context に挿入するミドルウェアです。
 * 
 * SSR をサポートするため、Hono のヘルパーを使用してクッキーの読み書きを管理します。
 *
 * @returns Hono の MiddlewareHandler
 */
export const supabaseMiddleware = (): MiddlewareHandler => {
	return async (c, next) => {
		const supabaseEnv = env<SupabaseEnv>(c);
		const supabaseUrl = supabaseEnv.SUPABASE_URL ?? supabaseEnv.VITE_SUPABASE_URL;
		const supabaseAnonKey =
			supabaseEnv.SUPABASE_ANON_KEY ??
			supabaseEnv.SUPABASE_PUBLISHABLE_KEY ??
			supabaseEnv.VITE_SUPABASE_ANON_KEY;

		if (!supabaseUrl) throw new Error('Supabase URL is missing');
		if (!supabaseAnonKey) throw new Error('Supabase anon key is missing');

		/*
		 * カスタムクッキー処理を含む Supabase クライアントの作成。
		 * Supabase のクッキー要件と Hono の実装を橋渡しするメソッドを注入しています。
		 */
		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				getAll() {
					const parsed = parseCookieHeader(c.req.header('Cookie') ?? '') as ParsedCookie[];
					// 宣言的なスタイル (flatMap) を使用
					const normalized = parsed.flatMap((cookie) =>
						(cookie.value === undefined ? [] : [{ name: cookie.name, value: cookie.value }])
					);
					return normalized.length > 0 ? normalized : null;
				},
				setAll(cookiesToSet: CookieToSet[]) {
					// 宣言的な反復処理
					cookiesToSet.forEach(({ name, value, options }) => {
						setCookie(c, name, value, toHonoCookieOptions(options));
					});
				},
			},
		});

		c.set('supabase', supabase);

		await next();
	};
};
