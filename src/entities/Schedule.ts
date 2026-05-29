export interface Schedule {
    id: string;
    propertyId: string,
    brokerId: string,
    startTime: Date,
    endTime: Date
    durationMinutes: number
}