/**
 * backend/src/features/health/interface/health.controller.spec.ts
 *
 * HealthController の単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from '../../../../src/features/health/interface/health.controller';
import type { Context } from 'hono';

describe('HealthController', () => {
    let controller: HealthController;
    const mockUseCase = {
        execute: vi.fn(),
    } as any;
    const mockJson = vi.fn();
    const mockContext = {
        json: mockJson,
    } as unknown as Context;

    beforeEach(() => {
        vi.resetAllMocks();
        controller = new HealthController(mockUseCase);
    });

    it('should return 200 when health check passes', async () => {
        // --- Arrange
        const successResult = { ok: true, auth: { status: 200 }, rest: { status: 200 } };
        mockUseCase.execute.mockResolvedValue(successResult);
        mockJson.mockReturnValue('mockResponse');

        // --- Act
        const result = await controller.getHealth(mockContext);

        // --- Assert
        expect(mockUseCase.execute).toHaveBeenCalled();
        expect(mockJson).toHaveBeenCalledWith(successResult);
        expect(result).toBe('mockResponse');
    });

    it('should return 500 when health check fails', async () => {
        // --- Arrange
        const failResult = { ok: false, target: 'auth', status: 500, body: 'error' };
        mockUseCase.execute.mockResolvedValue(failResult);
        mockJson.mockReturnValue('mockResponse');

        // --- Act
        const result = await controller.getHealth(mockContext);

        // --- Assert
        expect(mockUseCase.execute).toHaveBeenCalled();
        expect(mockJson).toHaveBeenCalledWith(failResult, 500);
        expect(result).toBe('mockResponse');
    });
});
