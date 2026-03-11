import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// List user's exams
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const exams = await prisma.exam.findMany({
            where: { userId: req.userId },
            orderBy: { name: 'asc' },
        });
        res.json(exams);
    } catch (error) {
        console.error('List exams error:', error);
        res.status(500).json({ error: 'Erro ao listar concursos' });
    }
});

// Create exam
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ error: 'Nome é obrigatório' });
            return;
        }

        const exam = await prisma.exam.upsert({
            where: { name_userId: { name: name.trim(), userId: req.userId! } },
            update: {},
            create: { name: name.trim(), userId: req.userId! },
        });
        res.status(201).json(exam);
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ error: 'Erro ao criar concurso' });
    }
});

// Delete exam
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const exam = await prisma.exam.findFirst({
            where: { id: req.params.id as string, userId: req.userId },
        });
        if (!exam) {
            res.status(404).json({ error: 'Concurso não encontrado' });
            return;
        }
        await prisma.exam.delete({ where: { id: req.params.id as string } });
        res.json({ message: 'Concurso removido' });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({ error: 'Erro ao remover concurso' });
    }
});

export { router as examsRouter };
