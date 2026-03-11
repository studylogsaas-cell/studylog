# 📚 StudyLog - Registro Diário de Estudos para Concurseiros

Aplicação web full-stack para registro diário de estudos, organização de materiais, anotações ricas e mapas mentais voltada para concurseiros.

## 🚀 Stack Tecnológica

| Camada    | Tecnologia                           |
|-----------|--------------------------------------|
| Frontend  | React 18 + TypeScript + Vite         |
| Backend   | Node.js + Express + TypeScript       |
| Banco     | SQLite (dev) / PostgreSQL (prod)     |
| ORM       | Prisma                               |
| Auth      | JWT (access + refresh tokens)        |
| Editor    | TipTap (rich text)                   |
| Mind Maps | SVG customizado + html2canvas (PNG)  |

## 📁 Estrutura do Projeto

```
studylog/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Schema do banco de dados
│   │   └── seed.ts           # Dados de exemplo
│   ├── src/
│   │   ├── index.ts          # Entry point da API
│   │   ├── lib/prisma.ts     # Cliente Prisma
│   │   ├── middleware/auth.ts # JWT middleware
│   │   └── routes/
│   │       ├── auth.ts       # Autenticação
│   │       ├── studyEntries.ts # CRUD de registros
│   │       ├── mindMaps.ts   # CRUD de mapas mentais
│   │       ├── dashboard.ts  # Agregações
│   │       ├── exams.ts      # Concursos
│   │       └── subjects.ts   # Disciplinas
│   └── tests/api.test.ts     # Testes de API
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Layout.tsx        # Layout com sidebar
│       │   ├── RichTextEditor.tsx # TipTap wrapper
│       │   └── MindMapEditor.tsx  # Editor de mapas mentais
│       ├── contexts/AuthContext.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx      # Login/Cadastro
│       │   ├── DashboardPage.tsx  # Dashboard
│       │   ├── EntriesPage.tsx    # Lista de registros
│       │   ├── EntryFormPage.tsx   # Criar/Editar
│       │   └── EntryViewPage.tsx   # Visualizar
│       └── services/api.ts
├── docker-compose.yml
└── README.md
```

## ⚡ Rodar Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init  # Cria banco SQLite + tabelas
npm run db:seed                      # Dados de exemplo
npm run dev                          # API em http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # App em http://localhost:5173
```

### 3. Login de Teste

| Campo | Valor              |
|-------|--------------------|
| Email | maria@example.com  |
| Senha | 123456             |

## 🐳 Rodar com Docker

```bash
docker-compose up --build
```

Isso sobe:
- **PostgreSQL** na porta 5432
- **Backend** na porta 3001 (com migration e seed automáticos)
- **Frontend** na porta 5173

## 🔧 Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável              | Descrição                    | Padrão                        |
|-----------------------|------------------------------|-------------------------------|
| `DATABASE_URL`        | URL do banco                 | `file:./dev.db` (SQLite)      |
| `JWT_SECRET`          | Chave do JWT                 | Deve ser alterada em produção |
| `JWT_REFRESH_SECRET`  | Chave do refresh token       | Deve ser alterada em produção |
| `JWT_EXPIRES_IN`      | Expiração do token           | `1h`                          |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh      | `7d`                          |
| `PORT`                | Porta da API                 | `3001`                        |
| `FRONTEND_URL`        | URL do frontend (CORS)       | `http://localhost:5173`       |

## 🧪 Testes

```bash
cd backend
npm test
```

Testes incluídos:
1. **Criar registro de estudo** - POST /api/study-entries
2. **Listar com filtros** - GET /api/study-entries com date range e exam filter
3. **Salvar/carregar mapa mental** - POST e GET completo com árvore JSON

## 📱 Funcionalidades

- ✅ Cadastro/Login com JWT
- ✅ Dashboard com horas semanais, mensais, total e última sessão
- ✅ CRUD completo de registros de estudo
- ✅ Filtros por período, concurso, disciplina e busca textual
- ✅ Editor rich text (TipTap) para anotações
- ✅ Materiais usados (livros, vídeos, PDFs, etc.)
- ✅ Mapas mentais em árvore com editor visual SVG
- ✅ Exportação de mapa mental em PNG
- ✅ Duplicar registro
- ✅ Cálculo automático de horas brutas
- ✅ Detecção de sobreposição de horários
- ✅ Tags/assuntos para categorização
- ✅ Dificuldade percebida (1-5 estrelas)
- ✅ Ciclos e dias de estudo
- ✅ UI responsiva (desktop e mobile)
- ✅ Sanitização HTML contra XSS
- ✅ Hash de senhas com bcrypt
