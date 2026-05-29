import { ScheduleController } from '../controllers/ScheduleController.js';
import { ScheduleRepository } from '../repositories/ScheduleRepository.js';
import { ScheduleService } from '../services/ScheduleService.js';

export const makeScheduleFactory = () => {
    const repository = new ScheduleRepository();
    const service = new ScheduleService(repository);
    return new ScheduleController(service);
} 