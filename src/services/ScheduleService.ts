import type { Schedule } from "../entities/Schedule.js";
import { BusinessError, ConflictError } from "../errors/AppErrors.js";
import { ScheduleRepository } from "../repositories/ScheduleRepository.js";
import { createBrasiliaDate, formatToYMD, getBrasiliaTime } from "../utils/dateUtils.js";

export interface CreateScheduleInput {
    brokerId: string;
    propertyId: string;
    startTime: Date;
    durationMinutes: number;
}

export class ScheduleService {
    constructor(private scheduleRepository: ScheduleRepository) { }

    private contador: number = 0;

    public createSchedule(input: CreateScheduleInput): Schedule {
        if (input.durationMinutes < 30 || input.durationMinutes > 180 || input.durationMinutes % 30 !== 0)
            throw new BusinessError('Duração deve ser múltiplo de 30, entre 30 e 180 minutos.');

        const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60000);

        const brStartDate = getBrasiliaTime(input.startTime);
        const brEndDate = getBrasiliaTime(endTime);

        const startTotalMinutes = (brStartDate.getUTCHours() * 60) + brStartDate.getUTCMinutes();
        const endTotalMinutes = (brEndDate.getUTCHours() * 60) + brEndDate.getUTCMinutes();

        const openingMinutes = 8 * 60;   
        const closingMinutos = 19 * 60; 

        if (startTotalMinutes < openingMinutes || endTotalMinutes > closingMinutos)
            throw new BusinessError('O agendamento deve ocorrer entre 08:00 e 19:00.');

        const dateString = formatToYMD(brStartDate);

        const dailySchedules = this.scheduleRepository.getSchedulesByBrokerAndDate(input.brokerId, dateString);

        const hasConflict = dailySchedules.some(schedule => {
            return input.startTime < schedule.endTime && endTime > schedule.startTime;
        });

        if (hasConflict) {
            const suggestions = this.generateSuggestions(dailySchedules, input.startTime, input.durationMinutes);

            throw new ConflictError(suggestions);
        }

        this.contador++;
        const newId = `ag-${String(this.contador).padStart(3, '0')}`;

        const newSchedule = {
            id: newId,
            brokerId: input.brokerId,
            propertyId: input.propertyId,
            startTime: input.startTime,
            endTime: endTime,
            durationMinutes: input.durationMinutes
        };

        this.scheduleRepository.save(newSchedule);

        return newSchedule;
    }

    public listByBrokerAndDate(brokerId: string, date: string) {
        return this.scheduleRepository.getSchedulesByBrokerAndDate(brokerId, date);
    }

    private generateSuggestions(dailySchedules: Schedule[], requestedDate: Date, durationMinutes: number): string[] {
        const brDate = getBrasiliaTime(requestedDate);
        const ymd = formatToYMD(requestedDate);

        const year = brDate.getUTCFullYear();
        const monthIndex = brDate.getUTCMonth();
        const day = brDate.getUTCDate();

        const freeSuggestions: string[] = [];

        let currentTestTime = createBrasiliaDate(year, monthIndex, day, 8, 0);
        const endOfDay = createBrasiliaDate(year, monthIndex, day, 19, 0);

        while (currentTestTime.getTime() + (durationMinutes * 60000) <= endOfDay.getTime() && freeSuggestions.length < 3) {
            const testEndTime = new Date(currentTestTime.getTime() + durationMinutes * 60000);

            const conflict = dailySchedules.some(schedule => {
                return currentTestTime < schedule.endTime && testEndTime > schedule.startTime;
            });

            if (!conflict) {
                const brTestDate = getBrasiliaTime(currentTestTime);
                const hours = String(brTestDate.getUTCHours()).padStart(2, '0');
                const minutes = String(brTestDate.getUTCMinutes()).padStart(2, '0');

                freeSuggestions.push(`${ymd}T${hours}:${minutes}:00-03:00`);
            }

            currentTestTime = new Date(currentTestTime.getTime() + 30 * 60000);
        }

        return freeSuggestions;
    }
}