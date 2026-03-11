import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Only seed if database is empty (no users exist)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('✅ Database already has data — skipping seed.');
        return;
    }

    console.log('🌱 Seeding database (first run)...');

    // Create demo user
    const password = await bcrypt.hash('123456', 12);
    const user = await prisma.user.create({
        data: {
            name: 'Maria Estudante',
            email: 'maria@example.com',
            password,
            timezone: 'America/Sao_Paulo',
        },
    });

    console.log(`✅ User created: ${user.email} (password: 123456)`);

    // Create exams
    const exams = await Promise.all([
        prisma.exam.create({ data: { name: 'TRF 1ª Região - AJAJ', userId: user.id } }),
        prisma.exam.create({ data: { name: 'TJ-SP - Escrevente', userId: user.id } }),
        prisma.exam.create({ data: { name: 'INSS - Técnico do Seguro Social', userId: user.id } }),
    ]);

    console.log(`✅ ${exams.length} exams created`);

    // Create subjects
    const subjects = await Promise.all([
        prisma.subject.create({ data: { name: 'Direito Constitucional', userId: user.id } }),
        prisma.subject.create({ data: { name: 'Direito Administrativo', userId: user.id } }),
        prisma.subject.create({ data: { name: 'Português', userId: user.id } }),
        prisma.subject.create({ data: { name: 'Raciocínio Lógico', userId: user.id } }),
        prisma.subject.create({ data: { name: 'Informática', userId: user.id } }),
        prisma.subject.create({ data: { name: 'Direito Processual Civil', userId: user.id } }),
    ]);

    console.log(`✅ ${subjects.length} subjects created`);

    // Create study entries
    const entries = [];
    const today = new Date();

    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const examIdx = i % exams.length;
        const subjectIdx = i % subjects.length;

        const startHour = 8 + (i % 3);
        const endHour = startHour + 2 + (i % 2);

        const entry = await prisma.studyEntry.create({
            data: {
                studyDate: dateStr,
                startTime: `${String(startHour).padStart(2, '0')}:00`,
                endTime: `${String(endHour).padStart(2, '0')}:30`,
                grossHours: endHour - startHour + 0.5,
                netHours: endHour - startHour,
                cycle: `Ciclo ${Math.ceil((i + 1) / 5)}`,
                cycleDay: (i % 5) + 1,
                notes: `<h2>Estudos do dia</h2><p>Hoje estudei <strong>${subjects[subjectIdx].name}</strong> com foco em questões de prova.</p><ul><li>Revisei os principais conceitos</li><li>Fiz 30 questões de múltipla escolha</li><li>Anotei pontos de atenção</li></ul>`,
                summary: `Estudei ${subjects[subjectIdx].name} para ${exams[examIdx].name}`,
                difficulty: (i % 5) + 1,
                tags: ['revisão', 'questões', subjects[subjectIdx].name.toLowerCase().replace(/ /g, '-')].join(','),
                userId: user.id,
                examId: exams[examIdx].id,
                subjectId: subjects[subjectIdx].id,
                materials: {
                    create: [
                        {
                            type: 'livro',
                            title: `Manual de ${subjects[subjectIdx].name}`,
                            details: 'Cap. ' + ((i % 10) + 1),
                        },
                        {
                            type: 'video',
                            title: `Aula ${(i % 20) + 1} - ${subjects[subjectIdx].name}`,
                            details: 'Estratégia Concursos',
                        },
                    ],
                },
            },
        });
        entries.push(entry);
    }

    console.log(`✅ ${entries.length} study entries created`);

    // Create mind maps for first 3 entries
    const mindMapData = [
        {
            title: 'Princípios Constitucionais',
            treeData: JSON.stringify({
                id: '1',
                label: 'Princípios Constitucionais',
                content: 'Art. 1º ao 4º da CF/88',
                children: [
                    {
                        id: '2',
                        label: 'Fundamentos (Art. 1º)',
                        content: 'Soberania, cidadania, dignidade, valores sociais, pluralismo',
                        children: [
                            { id: '5', label: 'Soberania', content: 'Poder supremo do Estado', children: [] },
                            { id: '6', label: 'Cidadania', content: 'Direitos políticos e civis', children: [] },
                        ],
                    },
                    {
                        id: '3',
                        label: 'Objetivos (Art. 3º)',
                        content: 'Sociedade livre, justa e solidária',
                        children: [
                            { id: '7', label: 'Erradicar pobreza', content: 'Reduzir desigualdades', children: [] },
                        ],
                    },
                    {
                        id: '4',
                        label: 'Separação dos Poderes',
                        content: 'Legislativo, Executivo, Judiciário',
                        children: [],
                    },
                ],
            }),
        },
        {
            title: 'Atos Administrativos',
            treeData: JSON.stringify({
                id: '1',
                label: 'Atos Administrativos',
                content: 'Manifestação unilateral de vontade da Administração',
                children: [
                    {
                        id: '2',
                        label: 'Requisitos',
                        content: 'CO-FI-FO-MO-OB',
                        children: [
                            { id: '3', label: 'Competência', content: 'Poder legal para praticar o ato', children: [] },
                            { id: '4', label: 'Finalidade', content: 'Interesse público', children: [] },
                            { id: '5', label: 'Forma', content: 'Modo de exteriorização', children: [] },
                            { id: '6', label: 'Motivo', content: 'Razão de fato e de direito', children: [] },
                            { id: '7', label: 'Objeto', content: 'Conteúdo do ato', children: [] },
                        ],
                    },
                    {
                        id: '8',
                        label: 'Atributos',
                        content: 'Características especiais',
                        children: [
                            { id: '9', label: 'Presunção de legitimidade', content: 'Até prova em contrário', children: [] },
                            { id: '10', label: 'Autoexecutoriedade', content: 'Sem necessidade do Judiciário', children: [] },
                        ],
                    },
                ],
            }),
        },
    ];

    for (let i = 0; i < Math.min(2, entries.length); i++) {
        await prisma.mindMap.create({
            data: {
                title: mindMapData[i].title,
                treeData: mindMapData[i].treeData,
                studyEntryId: entries[i].id,
            },
        });
    }

    console.log(`✅ 2 mind maps created`);
    console.log('\n🎉 Seed completed! Login with: maria@example.com / 123456');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
