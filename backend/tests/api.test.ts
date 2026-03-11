import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
let authToken: string;
let userId: string;
let examId: string;
let subjectId: string;
let entryId: string;

beforeAll(async () => {
    // Clean and setup test data
    await prisma.mindMap.deleteMany();
    await prisma.materialItem.deleteMany();
    await prisma.studyEntry.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash('test123', 12);
    const user = await prisma.user.create({
        data: { name: 'Test User', email: 'test@test.com', password },
    });
    userId = user.id;

    const exam = await prisma.exam.create({
        data: { name: 'TRF - Test', userId: user.id },
    });
    examId = exam.id;

    const subject = await prisma.subject.create({
        data: { name: 'Direito Constitucional', userId: user.id },
    });
    subjectId = subject.id;

    // Login to get token
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'test123' });
    authToken = res.body.accessToken;
});

afterAll(async () => {
    await prisma.mindMap.deleteMany();
    await prisma.materialItem.deleteMany();
    await prisma.studyEntry.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

describe('Study Entry API', () => {
    test('should create a study entry', async () => {
        const res = await request(app)
            .post('/api/study-entries')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                studyDate: '2025-03-01',
                startTime: '08:00',
                endTime: '10:30',
                netHours: 2.0,
                cycle: 'Ciclo 1',
                cycleDay: 1,
                examId,
                subjectId,
                summary: 'Estudei Direito Constitucional',
                difficulty: 3,
                tags: ['revisão', 'questões'],
                notes: '<p>Revisei os princípios fundamentais</p>',
                materials: [
                    { type: 'livro', title: 'Manual de Direito Constitucional', details: 'Cap. 1-3' },
                    { type: 'video', title: 'Aula 01 - Princípios', details: 'Prof. João' },
                ],
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.studyDate).toBe('2025-03-01');
        expect(res.body.grossHours).toBe(2.5);
        expect(res.body.netHours).toBe(2.0);
        expect(res.body.materials).toHaveLength(2);
        expect(res.body.exam.name).toBe('TRF - Test');
        expect(res.body.subject.name).toBe('Direito Constitucional');
        entryId = res.body.id;
    });
});

describe('Study Entry Filtering', () => {
    test('should list entries with filters', async () => {
        // Create another entry with a different date
        await request(app)
            .post('/api/study-entries')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                studyDate: '2025-02-15',
                startTime: '14:00',
                endTime: '16:00',
                netHours: 1.5,
                examId,
                subjectId,
                tags: ['teoria'],
            });

        // Filter by date range - should only get March entry
        const res = await request(app)
            .get('/api/study-entries')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ dateFrom: '2025-03-01', dateTo: '2025-03-31' });

        expect(res.status).toBe(200);
        expect(res.body.entries).toHaveLength(1);
        expect(res.body.entries[0].studyDate).toBe('2025-03-01');
        expect(res.body.total).toBe(1);

        // Filter by exam
        const res2 = await request(app)
            .get('/api/study-entries')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ examId });

        expect(res2.status).toBe(200);
        expect(res2.body.entries.length).toBeGreaterThanOrEqual(2);
    });
});

describe('Mind Map API', () => {
    test('should save and load a mind map', async () => {
        const treeData = {
            id: '1',
            label: 'Root Node',
            content: 'Main topic',
            children: [
                {
                    id: '2',
                    label: 'Child 1',
                    content: 'Sub topic 1',
                    children: [],
                },
                {
                    id: '3',
                    label: 'Child 2',
                    content: 'Sub topic 2',
                    children: [
                        {
                            id: '4',
                            label: 'Grandchild',
                            content: 'Deep topic',
                            children: [],
                        },
                    ],
                },
            ],
        };

        // Save
        const createRes = await request(app)
            .post(`/api/mind-maps/entry/${entryId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Test Mind Map', treeData });

        expect(createRes.status).toBe(201);
        expect(createRes.body.id).toBeDefined();
        expect(createRes.body.title).toBe('Test Mind Map');

        const mindMapId = createRes.body.id;

        // Load
        const loadRes = await request(app)
            .get(`/api/mind-maps/entry/${entryId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(loadRes.status).toBe(200);
        expect(loadRes.body).toHaveLength(1);

        const savedTree = JSON.parse(loadRes.body[0].treeData);
        expect(savedTree.label).toBe('Root Node');
        expect(savedTree.children).toHaveLength(2);
        expect(savedTree.children[1].children).toHaveLength(1);

        // Update
        treeData.children.push({
            id: '5',
            label: 'Child 3',
            content: 'New subtopic',
            children: [],
        });

        const updateRes = await request(app)
            .put(`/api/mind-maps/${mindMapId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ treeData });

        expect(updateRes.status).toBe(200);
        const updatedTree = JSON.parse(updateRes.body.treeData);
        expect(updatedTree.children).toHaveLength(3);
    });
});
