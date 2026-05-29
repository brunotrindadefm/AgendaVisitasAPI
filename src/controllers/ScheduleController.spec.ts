import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleController } from './ScheduleController.js';
import { ScheduleService } from '../services/ScheduleService.js';
import { ScheduleRepository } from '../repositories/ScheduleRepository.js';
import { ConflictError } from '../errors/AppErrors.js';

describe('ScheduleController', () => {
    let controller: ScheduleController;
    let mockResponse: any;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            createSchedule: vi.fn(),
            listByBrokerAndDate: vi.fn()
        };

        controller = new ScheduleController(mockService as unknown as ScheduleService);

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it('deve retornar status 400 se faltar campos obrigatórios no payload (Payload Malicioso)', () => {
        const mockRequest: any = {
            body: {
                corretorId: 'c-101',
                inicio: '2026-06-10T14:00:00-03:00'
            }
        };

        controller.create(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    it('deve retornar status 400 se a string de data for inválida (Payload Malicioso)', () => {
        const mockRequest: any = {
            body: {
                corretorId: 'c-101',
                imovelId: 'im-553',
                inicio: 'data-absurda-que-o-usuario-mandou',
                duracaoMinutos: 60
            }
        };

        controller.create(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Formato de data inválido. Use ISO 8601." });
    });

    it('deve retornar HTTP 201 e o DTO formatado estritamente em caso de sucesso', () => {
        const mockRequest: any = {
            body: { corretorId: 'c-101', imovelId: 'im-553', inicio: '2026-06-10T14:00:00-03:00', duracaoMinutos: 60 }
        };

        const mockSchedule = {
            id: 'ag-001', brokerId: 'c-101', propertyId: 'im-553',
            startTime: new Date('2026-06-10T14:00:00-03:00'),
            endTime: new Date('2026-06-10T15:00:00-03:00'),
            durationMinutes: 60
        };

        mockService.createSchedule.mockReturnValue(mockSchedule);

        controller.create(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
            agendamentoId: 'ag-001',
            corretorId: 'c-101',
            imovelId: 'im-553',
            inicio: '2026-06-10T14:00:00-03:00',
            fim: '2026-06-10T15:00:00-03:00',
            status: 'confirmado'
        });
    });

    it('deve retornar HTTP 409 e a lista de sugestões se o Service lançar ConflictError', () => {
        const mockRequest: any = {
            body: { corretorId: 'c-101', imovelId: 'im-553', inicio: '2026-06-10T14:00:00-03:00', duracaoMinutos: 60 }
        };

        const mockSugestoes = ['2026-06-10T08:00:00-03:00'];

        mockService.createSchedule.mockImplementation(() => {
            throw new ConflictError(mockSugestoes);
        });

        controller.create(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: "conflito",
            motivo: "Corretor indisponível no horário solicitado",
            sugestoes: mockSugestoes
        });
    });
});