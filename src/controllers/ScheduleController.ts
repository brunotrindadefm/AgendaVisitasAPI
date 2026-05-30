import type { CreateScheduleRequest } from "../dtos/scheduleDTO/CreateScheduleRequest.js";
import type { CreateScheduleResponse } from "../dtos/scheduleDTO/CreateScheduleResponse.js";
import type { ListSchedulesRequest } from "../dtos/scheduleDTO/ListSchedulesRequest.js";
import { BusinessError, ConflictError } from "../errors/AppErrors.js";
import { ScheduleService } from "../services/ScheduleService.js";
import type { Request, Response } from "express";
import { formatToISOWithOffset } from "../utils/dateUtils.js";

export class ScheduleController {
    constructor(private scheduleService: ScheduleService) { }

    public create = (req: Request<{}, {}, CreateScheduleRequest>, res: Response): void => {
        try {
            const payload = req.body;

            if (!payload.corretorId || !payload.imovelId || !payload.inicio || !payload.duracaoMinutos) {
                res.status(400).json({ error: "Todos os campos são obrigatórios." });
                return;
            }
            const parsedDate = new Date(payload.inicio);

            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({ error: "Formato de data inválido. Use ISO 8601." });
                return;
            }

            const serviceInput = {
                brokerId: payload.corretorId,
                propertyId: payload.imovelId,
                startTime: parsedDate,
                durationMinutes: payload.duracaoMinutos
            };

            const schedule = this.scheduleService.createSchedule(serviceInput);

            const responseDTO: CreateScheduleResponse = {
                agendamentoId: schedule.id,
                corretorId: schedule.brokerId,
                imovelId: schedule.propertyId,
                inicio: formatToISOWithOffset(schedule.startTime), 
                fim: formatToISOWithOffset(schedule.endTime),
                status: "confirmado"
            };

            res.status(201).json(responseDTO);

        } catch (error: unknown) {
            if (error instanceof ConflictError) {
                res.status(409).json({
                    status: "conflito",
                    motivo: "Corretor indisponível no horário solicitado",
                    sugestoes: error.suggestions
                });
                return;
            }
    
            if (error instanceof BusinessError) {
                res.status(400).json({ error: error.message });
                return;
            }
    
            console.error("Erro interno:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    }

    public getScheduleByBrokerAndDate = (req: Request<{}, {}, {}, ListSchedulesRequest>, res: Response): void => {
        try {
            const { corretorId, data } = req.query;

            if (!corretorId || !data) {
                res.status(400).json({ error: "Os parâmetros 'corretorId' e 'data' são obrigatórios." });
                return;
            }

            const schedules = this.scheduleService.listByBrokerAndDate(corretorId, data);

            const responseDTOs: CreateScheduleResponse[] = schedules.map(schedule => ({
                agendamentoId: schedule.id,
                corretorId: schedule.brokerId,
                imovelId: schedule.propertyId,
                inicio: formatToISOWithOffset(schedule.startTime),
                fim: formatToISOWithOffset(schedule.endTime),
                status: "confirmado"
            }));

            res.status(200).json(responseDTOs);

        } catch (error: unknown) {
            console.error("Erro ao listar agendamentos!", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
}