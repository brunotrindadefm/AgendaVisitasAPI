import { type Schedule } from "../entities/Schedule.js";
import { formatToYMD } from "../utils/dateUtils.js";

export class ScheduleRepository {
    private storage: Map<string, Schedule[]> = new Map();

    public save(schedule: Schedule): void {
        const brokerSchedules = this.storage.get(schedule.brokerId) || [];
        brokerSchedules.push(schedule);
        this.storage.set(schedule.brokerId, brokerSchedules);
    }

    public getSchedulesByBrokerAndDate(brokerId: string, date: string): Schedule[] {
        const brokerSchedules = this.storage.get(brokerId) || [];
        return brokerSchedules
        .filter(s => {
            return formatToYMD(s.startTime) === date;
        })
        .sort((a, b) => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
    }
}