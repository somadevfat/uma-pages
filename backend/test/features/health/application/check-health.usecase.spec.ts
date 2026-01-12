/**
 * backend/test/application/usecases/check-health.usecase.spec.ts
 *
 * CheckHealthUseCase の単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckHealthUseCase } from '../../../../src/features/health/application/check-health.usecase';
import type { HealthSupabaseRepositoryPort } from '../../../../src/features/health/application/ports/health.repository';
import type { HealthCheckResult } from '../../../../src/features/health/domain/health-check.vo';

describe('CheckHealthUseCase', () => {
    it('should delegate to repository', async () => {
        // --- Arrange
        const mockResult: HealthCheckResult = {
            ok: true,
            auth: { status: 200 },
            rest: { status: 200 },
        };
        const mockRepo = {
            checkConnection: vi.fn().mockResolvedValue(mockResult),
        } as unknown as HealthSupabaseRepositoryPort;

        const useCase = new CheckHealthUseCase(mockRepo);

        // --- Act
        const result = await useCase.execute();

        // --- Assert
        expect(result).toBe(mockResult);
        expect(mockRepo.checkConnection).toHaveBeenCalledOnce();
    });
});
