import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import CalendarView from '../components/CalendarView';

interface StudyEntry {
    id: string;
    studyDate: string;
    startTime: string;
    endTime: string;
    netHours: number;
    grossHours: number;
    summary: string | null;
    difficulty: number;
    tags: string;
    exam: { id: string; name: string } | null;
    subject: { id: string; name: string } | null;
    materials: any[];
    mindMaps: { id: string; title: string }[];
}

export default function EntriesPage() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<StudyEntry[]>([]);
    const [calendarEntries, setCalendarEntries] = useState<StudyEntry[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [examId, setExamId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [tag, setTag] = useState('');
    const [search, setSearch] = useState('');

    const [exams, setExams] = useState<{ id: string; name: string }[]>([]);
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        Promise.all([api.getExams(), api.getSubjects()])
            .then(([e, s]) => { setExams(e); setSubjects(s); });
    }, []);

    const fetchData = () => {
        setLoading(true);
        const params: Record<string, string> = {};
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (examId) params.examId = examId;
        if (subjectId) params.subjectId = subjectId;
        if (tag) params.tag = tag;
        if (search) params.search = search;

        if (viewMode === 'list') {
            params.page = String(page);
            api.getEntries(params)
                .then((data) => {
                    setEntries(data.entries);
                    setTotal(data.total);
                    setTotalPages(data.totalPages);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            api.getCalendarEntries(params)
                .then((data) => {
                    setCalendarEntries(data);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => { fetchData(); }, [page, viewMode]);

    const handleFilter = () => {
        if (viewMode === 'list') setPage(1);
        fetchData();
    };

    const handleClearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setExamId('');
        setSubjectId('');
        setTag('');
        setSearch('');
        if (viewMode === 'list') setPage(1);
        setTimeout(fetchData, 0);
    };

    const formatDate = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const renderStars = (difficulty: number) => (
        <div className="difficulty">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`star ${i <= difficulty ? '' : 'empty'}`}>★</span>
            ))}
        </div>
    );

    return (
        <div>
            <div className="entries-header" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Registros de Estudo</h1>
                    {viewMode === 'list' && <p>{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>}
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="view-toggle" style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4 }}>
                        <button
                            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : ''}`}
                            style={{ background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: viewMode === 'list' ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => setViewMode('list')}
                        >
                            📋 Lista
                        </button>
                        <button
                            className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : ''}`}
                            style={{ background: viewMode === 'calendar' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: viewMode === 'calendar' ? '#fff' : 'var(--text-primary)' }}
                            onClick={() => setViewMode('calendar')}
                        >
                            📅 Calendário
                        </button>
                    </div>
                    <Link to="/entries/new" className="btn btn-primary">➕ Novo Registro</Link>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <input
                    type="date"
                    className="form-control"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="Data início"
                />
                <input
                    type="date"
                    className="form-control"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="Data fim"
                />
                <select className="form-control" value={examId} onChange={(e) => setExamId(e.target.value)}>
                    <option value="">Todos os concursos</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select className="form-control" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                    <option value="">Todas as disciplinas</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input
                    type="text"
                    className="form-control search-input"
                    placeholder="🔍 Buscar nas anotações..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleFilter}>Filtrar</button>
                <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>Limpar</button>
            </div>

            {/* Entries list or calendar */}
            {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : viewMode === 'calendar' ? (
                <CalendarView entries={calendarEntries} />
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">📭</div>
                    <h3>Nenhum registro encontrado</h3>
                    <p>Ajuste os filtros ou crie um novo registro</p>
                </div>
            ) : (
                <>
                    {entries.map(entry => {
                        const [y, m, d] = entry.studyDate.split('-');
                        const monthIdx = parseInt(m) - 1;
                        const tags = entry.tags ? entry.tags.split(',').filter(Boolean) : [];

                        return (
                            <div
                                key={entry.id}
                                className="entry-card"
                                onClick={() => navigate(`/entries/${entry.id}`)}
                            >
                                <div className="entry-date-badge">
                                    <div className="day">{d}</div>
                                    <div className="month">{months[monthIdx]}</div>
                                </div>

                                <div className="entry-info">
                                    <h3>{entry.exam?.name || 'Sem concurso'} — {entry.subject?.name || 'Sem disciplina'}</h3>
                                    <div className="entry-meta">
                                        <span>🕐 {entry.startTime} - {entry.endTime}</span>
                                        <span>📖 {entry.netHours}h líquidas</span>
                                        <span>📚 {entry.materials.length} materiais</span>
                                        {entry.mindMaps.length > 0 && <span>🧠 {entry.mindMaps.length} mapa(s)</span>}
                                    </div>
                                    {entry.summary && (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4, fontStyle: 'italic' }}>
                                            {entry.summary}
                                        </div>
                                    )}
                                    {tags.length > 0 && (
                                        <div className="entry-tags">
                                            {tags.slice(0, 4).map(t => <span key={t} className="tag">{t}</span>)}
                                            {tags.length > 4 && <span className="tag">+{tags.length - 4}</span>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <div className="entry-hours">
                                        <div className="hours-value">{entry.netHours}h</div>
                                        <div className="hours-label">líquidas</div>
                                    </div>
                                    {renderStars(entry.difficulty)}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Anterior</button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = page <= 3 ? i + 1 : page - 2 + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        className={p === page ? 'active' : ''}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Próximo →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
