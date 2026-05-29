import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleService } from './ScheduleService.js';
import { ScheduleRepository } from '../repositories/ScheduleRepository.js';
import { BusinessError, ConflictError } from '../errors/AppErrors.js';

describe('ScheduleService', () => {
    let repository: ScheduleRepository;
    let service: ScheduleService;

    beforeEach(() => {
        repository = new ScheduleRepository();
        service = new ScheduleService(repository);
    });

    it('deve criar um agendamento com sucesso se o horário estiver livre e válido', () => {
        const input = {
            brokerId: 'c-101',
            propertyId: 'im-553',
            startTime: new Date('2026-06-10T14:00:00-03:00'),
            durationMinutes: 60
        };

        const result = service.createSchedule(input);

        expect(result).toHaveProperty('id');
        expect(result.brokerId).toBe('c-101');
        expect(result.durationMinutes).toBe(60);
    });

    it('deve lançar BusinessError se o agendamento terminar depois das 19:00', () => {
        const input = {
            brokerId: 'c-101',
            propertyId: 'im-553',
            startTime: new Date('2026-06-10T18:00:00-03:00'),
            durationMinutes: 120
        };

        expect(() => service.createSchedule(input)).toThrow(BusinessError);
        expect(() => service.createSchedule(input)).toThrow('O agendamento deve ocorrer entre 08:00 e 19:00.');
    });

    it('deve lançar ConflictError e retornar sugestões caso o horário esteja ocupado', () => {
        const input = {
            brokerId: 'c-101',
            propertyId: 'im-553',
            startTime: new Date('2026-06-10T10:00:00-03:00'),
            durationMinutes: 60
        };

        service.createSchedule(input);

        try {
            service.createSchedule(input);
        } catch (error) {
            expect(error).toBeInstanceOf(ConflictError);
            
            if (error instanceof ConflictError) {
                expect(Array.isArray(error.suggestions)).toBe(true);
                expect(error.suggestions.length).toBeGreaterThan(0);
                expect(error.suggestions[0]).toBe('2026-06-10T08:00:00-03:00');
            }
        }
    });

    it('deve lançar ConflictError em conflito PARCIAL (novo agendamento terminando no meio do existente)', () => {
        const input = {
            brokerId: 'c-101', propertyId: 'im-553',
            startTime: new Date('2026-06-10T10:00:00-03:00'), durationMinutes: 60 
        };
        service.createSchedule(input);

        const conflitoInput = { ...input, startTime: new Date('2026-06-10T09:30:00-03:00') };

        expect(() => service.createSchedule(conflitoInput)).toThrow(ConflictError);
    });

    it('deve lançar ConflictError em conflito PARCIAL (novo agendamento começando no meio do existente)', () => {
        const input = {
            brokerId: 'c-101', propertyId: 'im-553',
            startTime: new Date('2026-06-10T10:00:00-03:00'), durationMinutes: 60 
        };
        service.createSchedule(input);

        const conflitoInput = { ...input, startTime: new Date('2026-06-10T10:30:00-03:00') };

        expect(() => service.createSchedule(conflitoInput)).toThrow(ConflictError);
    });

    it('deve lançar ConflictError em conflito de ENGLOBAMENTO (novo agendamento cobre totalmente o existente)', () => {
        const input = {
            brokerId: 'c-101', propertyId: 'im-553',
            startTime: new Date('2026-06-10T10:00:00-03:00'), durationMinutes: 60 
        };
        service.createSchedule(input);

        const conflitoInput = { ...input, startTime: new Date('2026-06-10T09:00:00-03:00'), durationMinutes: 180 };

        expect(() => service.createSchedule(conflitoInput)).toThrow(ConflictError);
    });
});