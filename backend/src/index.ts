/*
 * backend/src/index.ts
 *
 * エントリポイント: Hono を使った軽量 API アプリケーション
 * このファイルは Supabase のヘルスチェックを行う `/dbcheck` エンドポイントを提供します。
 * 主な処理の流れ:
 *  - 環境変数 `SUPABASE_URL` / `SUPABASE_ANON_KEY` を取得
 *  - Supabase の Auth 側の `/auth/v1/health` と REST 側の `/rest/v1/` に対して疎通確認を行う
 *  - upstream に問題があればその情報を返す
 */

import { Hono } from 'hono';

/*
 * `Bindings` は Hono (Cloudflare Workers 等) で利用される環境変数の型定義です。
 * - SUPABASE_URL: Supabase プロジェクトのベース URL
 * - SUPABASE_ANON_KEY: 匿名アクセス用の公開キー (anon key)
 */
type Bindings = {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
};

/* Hono のアプリケーションインスタンスを作成します。Bindings を型パラメータで渡しています。 */
const app = new Hono<{ Bindings: Bindings }>();

/*
 * `truncate` ヘルパー
 * 長い文字列を指定した長さで切り詰める。デバッグ情報やレスポンスに長大な upstream ボディをそのまま返さないために使用します。
 */
const truncate = (value: string, max = 500) => value.slice(0, max);

/*
 * 環境変数が無い場合のエラーレスポンス生成ヘルパー
 * 引数: 環境変数名 (Bindings のキー)
 */
const jsonMissing = (name: keyof Bindings) => ({ ok: false as const, error: `${name} is missing` });

/*
 * upstream (Supabase) に対するエラー情報を整形するヘルパー
 * - target: 'auth' | 'rest' (どちらのサービスへのリクエストか)
 * - status: upstream の HTTP ステータス
 * - body: upstream のレスポンス本文 (長ければ truncate する)
 */
const jsonUpstreamError = (target: 'auth' | 'rest', status: number, body: string) => ({
	ok: false as const,
	target,
	status,
	body: truncate(body),
});

/*
 * `fetchAsText` ヘルパー
 * fetch を実行して、レスポンスオブジェクトと本文のテキストを返す。
 * 目的: レスポンスのステータスコード判定と本文のログ／返却を簡単にするため
 */
const fetchAsText = async (url: string, init: RequestInit) => {
	const res = await fetch(url, init);
	const body = await res.text();
	return { res, body };
};

/*
 * GET /dbcheck
 * Supabase の auth および rest のヘルスチェックを行う簡易エンドポイント
 * 本エンドポイントの主な責務:
 *  - 必要な環境変数の存在検査
 *  - Supabase の auth 側 (/auth/v1/health) に対してヘルスチェックリクエストを送信
 *  - Supabase の rest 側 (/rest/v1/) に対してルートリクエストを送信
 *  - upstream 側で 5xx 等の重大なエラーがあれば詳細を返す
 */
app.get('/dbcheck', async (c) => {
	// 環境変数を読み取り、前後の空白を削除する
	const url = c.env.SUPABASE_URL?.trim();
	const anonKey = c.env.SUPABASE_ANON_KEY?.trim();

	// 必須の環境変数が無ければ 500 で早期リターン
	if (!url) return c.json(jsonMissing('SUPABASE_URL'), 500);
	if (!anonKey) return c.json(jsonMissing('SUPABASE_ANON_KEY'), 500);

	// Supabase に渡す共通ヘッダ (匿名キーを apikey / Authorization に設定)
	const supabaseHeaders = {
		apikey: anonKey,
		Authorization: `Bearer ${anonKey}`,
	};

	// Auth のヘルスチェック URL を組み立ててリクエスト
	const authHealthUrl = new URL('/auth/v1/health', url).toString();
	const { res: authRes, body: authBody } = await fetchAsText(authHealthUrl, {
		headers: supabaseHeaders,
	});

	// auth 側のレスポンスが OK でなければ upstream エラーとして扱う
	if (!authRes.ok) {
		return c.json(jsonUpstreamError('auth', authRes.status, authBody), 500);
	}

	// REST のルートに対してリクエストを送り、ステータスをチェック
	const restUrl = new URL('/rest/v1/', url).toString();
	const { res: restRes, body: restBody } = await fetchAsText(restUrl, {
		headers: supabaseHeaders,
	});

	// REST 側がサーバーエラー (5xx) を返した場合は upstream エラーとして扱う
	if (restRes.status >= 500) {
		return c.json(jsonUpstreamError('rest', restRes.status, restBody), 500);
	}

	// 正常系レスポンス: upstream の各ステータスコードを返す
	return c.json({ ok: true, auth: { status: authRes.status }, rest: { status: restRes.status } });
});

/* デフォルトエクスポート: Hono アプリケーション */
export default app;
