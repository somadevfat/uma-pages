/**
 * backend/src/features/health/infrastructure/health-supabase.repository.spec.ts
 *
 * HealthSupabaseRepository の統合テスト (Real DB)
 */
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { HealthSupabaseRepository } from '../../../../src/features/health/infrastructure/health-supabase.repository';

describe.skipIf(!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)('HealthSupabaseRepository (Integration)', () => {
    it('should connect to real Supabase instance', async () => {
        // --- Arrange
        const repository = new HealthSupabaseRepository(fetch, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

        // --- Act
        const result = await repository.checkConnection();

        // --- Assert
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.auth?.status).toBe(200);
            expect(result.rest?.status).toBe(200);
        }
    });

    it('should fail with invalid credentials', async () => {
        // --- Arrange
        const url = env.SUPABASE_URL;
        const invalidKey = 'invalid-key';
        const repository = new HealthSupabaseRepository(fetch, url, invalidKey);

        // --- Act
        const result = await repository.checkConnection();

        // --- Assert
        expect(result.ok).toBe(false);
    });
});
