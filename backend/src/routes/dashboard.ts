import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const userId = req.userId!;

        // Current week (Monday to Sunday)
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const weekStart = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const weekEnd = sunday.toISOString().split('T')[0];

        // Current month
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

        // Weekly hours
        const weekEntries = await prisma.studyEntry.findMany({
            where: { userId, studyDate: { gte: weekStart, lte: weekEnd } },
            select: { netHours: true },
        });
        const weeklyHours = weekEntries.reduce((sum, e) => sum + e.netHours, 0);

        // Monthly hours
        const monthEntries = await prisma.studyEntry.findMany({
            where: { userId, studyDate: { gte: monthStart, lte: monthEnd } },
            select: { netHours: true, studyDate: true },
        });
        const monthlyHours = monthEntries.reduce((sum, e) => sum + e.netHours, 0);

        // Days studied this month
        const uniqueDays = new Set(monthEntries.map(e => e.studyDate));
        const daysStudied = uniqueDays.size;

        // Last session
        const lastSession = await prisma.studyEntry.findFirst({
            where: { userId },
            orderBy: [{ studyDate: 'desc' }, { startTime: 'desc' }],
            include: {
                exam: { select: { name: true } },
                subject: { select: { name: true } },
            },
        });

        // Total hours overall
        const allEntries = await prisma.studyEntry.findMany({
            where: { userId },
            select: { netHours: true },
        });
        const totalHours = allEntries.reduce((sum, e) => sum + e.netHours, 0);

        // Total entries
        const totalEntries = allEntries.length;

        res.json({
            weeklyHours: Math.round(weeklyHours * 100) / 100,
            monthlyHours: Math.round(monthlyHours * 100) / 100,
            daysStudied,
            totalHours: Math.round(totalHours * 100) / 100,
            totalEntries,
            lastSession: lastSession ? {
                id: lastSession.id,
                studyDate: lastSession.studyDate,
                startTime: lastSession.startTime,
                endTime: lastSession.endTime,
                netHours: lastSession.netHours,
                examName: lastSession.exam?.name || null,
                subjectName: lastSession.subject?.name || null,
                summary: lastSession.summary,
            } : null,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

export { router as dashboardRouter };
