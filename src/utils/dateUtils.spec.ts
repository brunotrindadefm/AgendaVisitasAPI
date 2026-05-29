import { describe, it, expect } from 'vitest';
import { getBrasiliaTime, formatToYMD, createBrasiliaDate } from './dateUtils.js';

describe('dateUtils', () => {
    it('deve converter uma data UTC para o fuso de Brasília (UTC-3)', () => {
        const dataUTC = new Date(Date.UTC(2026, 5, 10, 15, 0)); 
        const dataBR = getBrasiliaTime(dataUTC);
        
        expect(dataBR.getUTCHours()).toBe(12);
    });

    it('deve formatar a data corretamente no padrão YYYY-MM-DD considerando o fuso', () => {
        const dataUTC = new Date(Date.UTC(2026, 5, 11, 2, 0)); 
        const ymd = formatToYMD(dataUTC);
        
        expect(ymd).toBe('2026-06-10');
    });

    it('deve fabricar uma data exata de Brasília sem depender do parser do Node', () => {
        const dataFabricada = createBrasiliaDate(2026, 5, 10, 8, 0);
        
        expect(dataFabricada.getUTCHours()).toBe(11);
    });
});