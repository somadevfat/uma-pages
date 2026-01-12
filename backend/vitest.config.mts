import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		coverage: {
			enabled: true,
			provider: 'istanbul',
			reporter: ['text', 'json', 'html'],
			exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '**/test/**'],
		},
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
	},
});
