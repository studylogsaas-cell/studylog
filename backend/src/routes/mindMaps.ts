import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// List mind maps for a study entry
router.get('/entry/:entryId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const entry = await prisma.studyEntry.findFirst({
            where: { id: req.params.entryId as string, userId: req.userId },
        });
        if (!entry) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }

        const mindMaps = await prisma.mindMap.findMany({
            where: { studyEntryId: req.params.entryId as string },
            orderBy: { createdAt: 'desc' },
        });
        res.json(mindMaps);
    } catch (error) {
        console.error('List mind maps error:', error);
        res.status(500).json({ error: 'Erro ao listar mapas mentais' });
    }
});

// Create mind map
router.post('/entry/:entryId', [
    body('title').trim().notEmpty().withMessage('Título é obrigatório'),
    body('treeData').notEmpty().withMessage('Dados da árvore são obrigatórios'),
], async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const entry = await prisma.studyEntry.findFirst({
            where: { id: req.params.entryId as string, userId: req.userId },
        });
        if (!entry) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }

        const { title, treeData } = req.body;
        const treeString = typeof treeData === 'string' ? treeData : JSON.stringify(treeData);

        const mindMap = await prisma.mindMap.create({
            data: {
                title,
                treeData: treeString,
                studyEntryId: req.params.entryId as string,
            },
        });

        res.status(201).json(mindMap);
    } catch (error) {
        console.error('Create mind map error:', error);
        res.status(500).json({ error: 'Erro ao criar mapa mental' });
    }
});

// Update mind map
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const mindMap = await prisma.mindMap.findFirst({
            where: { id: req.params.id as string },
            include: { studyEntry: { select: { userId: true } } },
        });
        if (!mindMap || mindMap.studyEntry.userId !== req.userId) {
            res.status(404).json({ error: 'Mapa mental não encontrado' });
            return;
        }

        const { title, treeData } = req.body;
        const treeString = treeData
            ? (typeof treeData === 'string' ? treeData : JSON.stringify(treeData))
            : mindMap.treeData;

        const updated = await prisma.mindMap.update({
            where: { id: req.params.id as string },
            data: {
                title: title || mindMap.title,
                treeData: treeString,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Update mind map error:', error);
        res.status(500).json({ error: 'Erro ao atualizar mapa mental' });
    }
});

// Delete mind map
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log('DELETE request for mind map id:', req.params.id, 'from user:', req.userId);
        const mindMap = await prisma.mindMap.findFirst({
            where: { id: req.params.id as string },
            include: { studyEntry: { select: { userId: true } } },
        });
        console.log('Found mindMap?', !!mindMap);
        if (mindMap) console.log('userId match?', mindMap.studyEntry.userId === req.userId);

        if (!mindMap || mindMap.studyEntry.userId !== req.userId) {
            console.log('Validation failed. Returning 404.');
            res.status(404).json({ error: 'Mapa mental não encontrado' });
            return;
        }

        await prisma.mindMap.delete({ where: { id: req.params.id as string } });
        console.log('Deleted successfully from DB.');
        res.json({ message: 'Mapa mental removido com sucesso' });
    } catch (error) {
        console.error('Delete mind map error:', error);
        res.status(500).json({ error: 'Erro ao remover mapa mental' });
    }
});

export { router as mindMapsRouter };
