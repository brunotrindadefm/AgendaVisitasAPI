import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleRepository } from './ScheduleRepository.js';
import type { Schedule } from '../entities/Schedule.js';

describe('ScheduleRepository', () => {
    let repository: ScheduleRepository;

    beforeEach(() => {
        repository = new ScheduleRepository();
    });

    it('deve salvar um agendamento no Map em memória', () => {
        const schedule: Schedule = {
            id: 'ag-001', brokerId: 'c-101', propertyId: 'im-553',
            startTime: new Date('2026-06-10T14:00:00-03:00'),
            endTime: new Date('2026-06-10T15:00:00-03:00'),
            durationMinutes: 60
        };

        repository.save(schedule);
        const result = repository.getSchedulesByBrokerAndDate('c-101', '2026-06-10');

        expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio se não houver agendamento para o corretor na data', () => {
        const result = repository.getSchedulesByBrokerAndDate('c-999', '2026-06-10');
        expect(result).toEqual([]);
    });
});