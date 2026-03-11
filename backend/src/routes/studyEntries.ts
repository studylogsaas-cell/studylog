import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

// Use require for isomorphic-dompurify to avoid ESM mismatch
const DOMPurify = require('isomorphic-dompurify');

const router = Router();
router.use(authMiddleware);

function calculateGrossHours(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = endMinutes - startMinutes;
    return Math.round((diff / 60) * 100) / 100;
}

// List study entries with filters
router.get('/', [
    query('dateFrom').optional().isString(),
    query('dateTo').optional().isString(),
    query('examId').optional().isString(),
    query('subjectId').optional().isString(),
    query('tag').optional().isString(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { dateFrom, dateTo, examId, subjectId, tag, search } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const where: any = { userId: req.userId };

        if (dateFrom) where.studyDate = { ...where.studyDate, gte: dateFrom as string };
        if (dateTo) where.studyDate = { ...where.studyDate, lte: dateTo as string };
        if (examId) where.examId = examId as string;
        if (subjectId) where.subjectId = subjectId as string;
        if (tag) where.tags = { contains: tag as string };
        if (search) where.notes = { contains: search as string };

        const [entries, total] = await Promise.all([
            prisma.studyEntry.findMany({
                where,
                include: {
                    exam: { select: { id: true, name: true } },
                    subject: { select: { id: true, name: true } },
                    materials: true,
                    mindMaps: { select: { id: true, title: true } },
                },
                orderBy: [{ studyDate: 'desc' }, { startTime: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.studyEntry.count({ where }),
        ]);

        res.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('List entries error:', error);
        res.status(500).json({ error: 'Erro ao listar registros' });
    }
});

// Get unpaginated calendar events
router.get('/calendar', [
    query('dateFrom').optional().isString(),
    query('dateTo').optional().isString(),
    query('examId').optional().isString(),
    query('subjectId').optional().isString(),
    query('tag').optional().isString(),
    query('search').optional().isString(),
], async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { dateFrom, dateTo, examId, subjectId, tag, search } = req.query;
        const where: any = { userId: req.userId };

        if (dateFrom) where.studyDate = { ...where.studyDate, gte: dateFrom as string };
        if (dateTo) where.studyDate = { ...where.studyDate, lte: dateTo as string };
        if (examId) where.examId = examId as string;
        if (subjectId) where.subjectId = subjectId as string;
        if (tag) where.tags = { contains: tag as string };
        if (search) where.notes = { contains: search as string };

        const entries = await prisma.studyEntry.findMany({
            where,
            include: {
                exam: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
            },
            orderBy: [{ studyDate: 'asc' }, { startTime: 'asc' }],
        });

        res.json(entries);
    } catch (error) {
        console.error('List calendar entries error:', error);
        res.status(500).json({ error: 'Erro ao buscar eventos do calendário' });
    }
});

// Get single entry
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entryId = req.params.id as string;
        const entry = await prisma.studyEntry.findFirst({
            where: { id: entryId, userId: req.userId as string },
            include: {
                exam: true,
                subject: true,
                materials: true,
                mindMaps: true,
            },
        });
        if (!entry) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }
        res.json(entry);
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({ error: 'Erro ao buscar registro' });
    }
});

// Create entry
router.post('/', [
    body('studyDate').notEmpty().withMessage('Data é obrigatória'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Hora de início inválida'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('Hora de término inválida'),
    body('netHours').isFloat({ min: 0 }).withMessage('Horas líquidas inválidas'),
    body('difficulty').optional().isInt({ min: 1, max: 5 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const {
            studyDate, startTime, endTime, netHours, cycle, cycleDay,
            notes, summary, difficulty, tags, examId, examName,
            subjectId, subjectName, materials,
        } = req.body;

        // Validate time range
        const grossHours = calculateGrossHours(startTime, endTime);
        if (grossHours <= 0) {
            res.status(400).json({ error: 'Hora final deve ser maior que hora inicial' });
            return;
        }

        // Check for overlapping entry
        const overlap = await prisma.studyEntry.findFirst({
            where: {
                userId: req.userId!,
                studyDate,
                OR: [
                    { startTime: { lte: startTime }, endTime: { gt: startTime } },
                    { startTime: { lt: endTime }, endTime: { gte: endTime } },
                    { startTime: { gte: startTime }, endTime: { lte: endTime } },
                ],
            },
        });
        if (overlap) {
            res.status(409).json({ error: 'Já existe um registro neste horário', overlappingId: overlap.id });
            return;
        }

        // Get or create exam
        let finalExamId = examId || null;
        if (!finalExamId && examName) {
            const exam = await prisma.exam.upsert({
                where: { name_userId: { name: examName, userId: req.userId! } },
                update: {},
                create: { name: examName, userId: req.userId! },
            });
            finalExamId = exam.id;
        }

        // Get or create subject
        let finalSubjectId = subjectId || null;
        if (!finalSubjectId && subjectName) {
            const subject = await prisma.subject.upsert({
                where: { name_userId: { name: subjectName, userId: req.userId! } },
                update: {},
                create: { name: subjectName, userId: req.userId! },
            });
            finalSubjectId = subject.id;
        }

        // Sanitize notes
        const sanitizedNotes = notes ? DOMPurify.sanitize(notes) : null;

        const entry = await prisma.studyEntry.create({
            data: {
                studyDate,
                startTime,
                endTime,
                grossHours,
                netHours: parseFloat(netHours),
                cycle: cycle || null,
                cycleDay: cycleDay ? parseInt(cycleDay) : null,
                notes: sanitizedNotes,
                summary: summary || null,
                difficulty: difficulty || 3,
                tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
                userId: req.userId!,
                examId: finalExamId,
                subjectId: finalSubjectId,
                materials: materials?.length ? {
                    create: materials.map((m: any) => ({
                        type: m.type,
                        title: m.title,
                        details: m.details || null,
                    })),
                } : undefined,
            },
            include: {
                exam: true,
                subject: true,
                materials: true,
                mindMaps: true,
            },
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Erro ao criar registro' });
    }
});

// Update entry
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entryId = req.params.id as string;
        const existing = await prisma.studyEntry.findFirst({
            where: { id: entryId, userId: req.userId as string },
        });
        if (!existing) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }

        const {
            studyDate, startTime, endTime, netHours, cycle, cycleDay,
            notes, summary, difficulty, tags, examId, examName,
            subjectId, subjectName, materials,
        } = req.body;

        const grossHours = startTime && endTime ? calculateGrossHours(startTime, endTime) : existing.grossHours;

        let finalExamId = examId || existing.examId;
        if (!examId && examName) {
            const exam = await prisma.exam.upsert({
                where: { name_userId: { name: examName, userId: req.userId! } },
                update: {},
                create: { name: examName, userId: req.userId! },
            });
            finalExamId = exam.id;
        }

        let finalSubjectId = subjectId || existing.subjectId;
        if (!subjectId && subjectName) {
            const subject = await prisma.subject.upsert({
                where: { name_userId: { name: subjectName, userId: req.userId! } },
                update: {},
                create: { name: subjectName, userId: req.userId! },
            });
            finalSubjectId = subject.id;
        }

        const sanitizedNotes = notes ? DOMPurify.sanitize(notes) : existing.notes;

        // Update materials if provided
        if (materials) {
            await prisma.materialItem.deleteMany({ where: { studyEntryId: entryId } });
            if (materials.length > 0) {
                await prisma.materialItem.createMany({
                    data: materials.map((m: any) => ({
                        type: m.type,
                        title: m.title,
                        details: m.details || null,
                        studyEntryId: entryId,
                    })),
                });
            }
        }

        const entry = await prisma.studyEntry.update({
            where: { id: entryId },
            data: {
                studyDate: studyDate || existing.studyDate,
                startTime: startTime || existing.startTime,
                endTime: endTime || existing.endTime,
                grossHours,
                netHours: netHours !== undefined ? parseFloat(netHours) : existing.netHours,
                cycle: cycle !== undefined ? cycle : existing.cycle,
                cycleDay: cycleDay !== undefined ? (cycleDay ? parseInt(cycleDay) : null) : existing.cycleDay,
                notes: sanitizedNotes,
                summary: summary !== undefined ? summary : existing.summary,
                difficulty: difficulty || existing.difficulty,
                tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : existing.tags,
                examId: finalExamId,
                subjectId: finalSubjectId,
            },
            include: {
                exam: true,
                subject: true,
                materials: true,
                mindMaps: true,
            },
        });

        res.json(entry);
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Erro ao atualizar registro' });
    }
});

// Delete entry
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entryId = req.params.id as string;
        const existing = await prisma.studyEntry.findFirst({
            where: { id: entryId, userId: req.userId as string },
        });
        if (!existing) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }

        await prisma.studyEntry.delete({ where: { id: entryId } });
        res.json({ message: 'Registro removido com sucesso' });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Erro ao remover registro' });
    }
});

// Duplicate entry
router.post('/:id/duplicate', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entryId = req.params.id as string;
        const original = await prisma.studyEntry.findFirst({
            where: { id: entryId, userId: req.userId as string },
            include: { materials: true },
        });
        if (!original) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const entry = await prisma.studyEntry.create({
            data: {
                studyDate: today,
                startTime: original.startTime,
                endTime: original.endTime,
                grossHours: original.grossHours,
                netHours: original.netHours,
                cycle: original.cycle,
                cycleDay: original.cycleDay,
                notes: original.notes,
                summary: original.summary,
                difficulty: original.difficulty,
                tags: original.tags,
                userId: req.userId!,
                examId: original.examId,
                subjectId: original.subjectId,
                materials: original.materials.length > 0 ? {
                    create: original.materials.map((m: any) => ({
                        type: m.type,
                        title: m.title,
                        details: m.details,
                    })),
                } : undefined,
            },
            include: { exam: true, subject: true, materials: true, mindMaps: true },
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error('Duplicate entry error:', error);
        res.status(500).json({ error: 'Erro ao duplicar registro' });
    }
});

export { router as studyEntriesRouter };
