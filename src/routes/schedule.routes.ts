import { Router } from "express";
import { makeScheduleFactory } from "../factories/makeScheduleController.js";

const routes = Router();

const scheduleController = makeScheduleFactory();

routes.post('/agendamentos', scheduleController.create)

routes.get('/agendamentos', scheduleController.getScheduleByBrokerAndDate);

export default routes