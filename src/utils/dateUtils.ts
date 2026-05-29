export const getBrasiliaTime = (date: Date): Date => {
    return new Date(date.getTime() - (3 * 60 * 60 * 1000));
};

export const formatToYMD = (date: Date): string => {
    const brDate = getBrasiliaTime(date);
    const year = brDate.getUTCFullYear();
    const month = String(brDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(brDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const createBrasiliaDate = (year: number, monthIndex: number, day: number, hour: number, minute: number): Date => {
    return new Date(Date.UTC(year, monthIndex, day, hour + 3, minute));
};

export const formatToISOWithOffset = (date: Date): string => {
    const brDate = getBrasiliaTime(date);
    
    const year = brDate.getUTCFullYear();
    const month = String(brDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(brDate.getUTCDate()).padStart(2, '0');
    const hours = String(brDate.getUTCHours()).padStart(2, '0');
    const minutes = String(brDate.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:00-03:00`;
};