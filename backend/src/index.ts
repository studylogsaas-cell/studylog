import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { studyEntriesRouter } from './routes/studyEntries';
import { mindMapsRouter } from './routes/mindMaps';
import { dashboardRouter } from './routes/dashboard';
import { examsRouter } from './routes/exams';
import { subjectsRouter } from './routes/subjects';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/study-entries', studyEntriesRouter);
app.use('/api/mind-maps', mindMapsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/exams', examsRouter);
app.use('/api/subjects', subjectsRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 StudyLog API running on http://localhost:${PORT}`);
    });
}

export default app;
