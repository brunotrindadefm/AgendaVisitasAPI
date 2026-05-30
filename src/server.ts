import express, { type Request, type Response } from 'express';
import scheduleRoutes from './routes/schedule.routes.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', scheduleRoutes);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Rota não encontrada. Verifique o endpoint e o método HTTP." });
});

app.listen(PORT, () => {
    console.log(`Application is running on port: ${PORT}`);
})