import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// List user's subjects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: req.userId },
            orderBy: { name: 'asc' },
        });
        res.json(subjects);
    } catch (error) {
        console.error('List subjects error:', error);
        res.status(500).json({ error: 'Erro ao listar disciplinas' });
    }
});

// Create subject
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        if (!name?.trim()) {
            res.status(400).json({ error: 'Nome é obrigatório' });
            return;
        }

        const subject = await prisma.subject.upsert({
            where: { name_userId: { name: name.trim(), userId: req.userId! } },
            update: {},
            create: { name: name.trim(), userId: req.userId! },
        });
        res.status(201).json(subject);
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Erro ao criar disciplina' });
    }
});

// Delete subject
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const subject = await prisma.subject.findFirst({
            where: { id: req.params.id as string, userId: req.userId },
        });
        if (!subject) {
            res.status(404).json({ error: 'Disciplina não encontrada' });
            return;
        }
        await prisma.subject.delete({ where: { id: req.params.id as string } });
        res.json({ message: 'Disciplina removida' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: 'Erro ao remover disciplina' });
    }
});

export { router as subjectsRouter };
