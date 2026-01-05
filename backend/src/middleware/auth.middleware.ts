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

export const getSupabase = (c: Context) => {
	return c.get('supabase');
};

type SupabaseEnv = {
	SUPABASE_URL?: string;
	SUPABASE_ANON_KEY?: string;
	SUPABASE_PUBLISHABLE_KEY?: string;
	VITE_SUPABASE_URL?: string;
	VITE_SUPABASE_ANON_KEY?: string;
};

type ParsedCookie = { name: string; value?: string };

type CookieToSet = {
	name: string;
	value: string;
	options: SupabaseCookieOptions;
};

const toHonoSameSite = (sameSite: SupabaseCookieOptions['sameSite']): HonoCookieOptions['sameSite'] | undefined => {
	if (sameSite === true) return 'strict';
	if (sameSite === false || sameSite === undefined) return undefined;

	return sameSite;
};

const toHonoPriority = (priority: SupabaseCookieOptions['priority']): HonoCookieOptions['priority'] | undefined => {
	if (priority === undefined) return undefined;

	return priority;
};

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
		priority: toHonoPriority(options.priority),
	};

	if (converted.partitioned === true) {
		converted.secure = true;
	}

	return converted;
};

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

		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				getAll() {
					const parsed = parseCookieHeader(c.req.header('Cookie') ?? '') as ParsedCookie[];
					const normalized = parsed.flatMap((cookie) => (cookie.value === undefined ? [] : [{ name: cookie.name, value: cookie.value }]));

					return normalized.length > 0 ? normalized : null;
				},
				setAll(cookiesToSet: CookieToSet[]) {
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
