import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function generateTokens(userId: string) {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        { expiresIn: '7d' } as jwt.SignOptions
    );
    return { accessToken, refreshToken };
}

// Register
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
], async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const { name, email, password, timezone } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email já cadastrado' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, timezone: timezone || 'America/Sao_Paulo' },
        });

        const tokens = generateTokens(user.id);
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
            ...tokens,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty(),
], async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        const tokens = generateTokens(user.id);
        res.json({
            user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
            ...tokens,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Refresh token
router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token é obrigatório' });
        return;
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'refresh-secret'
        ) as { userId: string };
        const tokens = generateTokens(decoded.userId);
        res.json(tokens);
    } catch {
        res.status(401).json({ error: 'Refresh token inválido' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, name: true, email: true, timezone: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

export { router as authRouter };
