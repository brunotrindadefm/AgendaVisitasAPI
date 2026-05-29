import express from 'express';
import scheduleRoutes from './routes/schedule.routes.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', scheduleRoutes);

app.listen(PORT, () => {
    console.log(`Application is running on port: ${PORT}`);
})