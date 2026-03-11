import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface DashboardData {
    weeklyHours: number;
    monthlyHours: number;
    daysStudied: number;
    totalHours: number;
    totalEntries: number;
    lastSession: {
        id: string;
        studyDate: string;
        startTime: string;
        endTime: string;
        netHours: number;
        examName: string | null;
        subjectName: string | null;
        summary: string | null;
    } | null;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getDashboard()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    const formatDate = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Acompanhe seu progresso nos estudos</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horas na Semana</div>
                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 500, letterSpacing: '-0.02em', WebkitTextFillColor: 'initial', background: 'none', color: 'var(--text-primary)' }}>{data?.weeklyHours?.toFixed(1) || '0'}h</div>
                </div>
                <div className="stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horas no Mês</div>
                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 500, letterSpacing: '-0.02em', WebkitTextFillColor: 'initial', background: 'none', color: 'var(--text-primary)' }}>{data?.monthlyHours?.toFixed(1) || '0'}h</div>
                </div>
                <div className="stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dias no Mês</div>
                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 500, letterSpacing: '-0.02em', WebkitTextFillColor: 'initial', background: 'none', color: 'var(--text-primary)' }}>{data?.daysStudied || 0}</div>
                </div>
                <div className="stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Geração</div>
                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 500, letterSpacing: '-0.02em', WebkitTextFillColor: 'initial', background: 'none', color: 'var(--text-primary)' }}>{data?.totalHours?.toFixed(1) || '0'}h</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Last session */}
                <div className="card">
                    <div className="card-header">
                        <h3>📝 Última Sessão</h3>
                        {data?.lastSession && (
                            <Link to={`/entries/${data.lastSession.id}`} className="btn btn-sm btn-secondary">
                                Ver detalhes
                            </Link>
                        )}
                    </div>
                    {data?.lastSession ? (
                        <div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                                <div className="entry-date-badge">
                                    <div className="day">{data.lastSession.studyDate.split('-')[2]}</div>
                                    <div className="month">
                                        {new Date(data.lastSession.studyDate + 'T12:00').toLocaleString('pt-BR', { month: 'short' })}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {data.lastSession.examName || 'Sem concurso'}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {data.lastSession.subjectName || 'Sem disciplina'}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                                        {data.lastSession.startTime} - {data.lastSession.endTime} · {data.lastSession.netHours}h líquidas
                                    </div>
                                </div>
                            </div>
                            {data.lastSession.summary && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    "{data.lastSession.summary}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="emoji">📖</div>
                            <h3>Nenhum registro ainda</h3>
                            <p>Comece registrando sua primeira sessão de estudo!</p>
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                <div className="card">
                    <div className="card-header">
                        <h3>⚡ Ações Rápidas</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Link to="/entries/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                            ➕ Novo Registro de Estudo
                        </Link>
                        <Link to="/entries" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                            📋 Ver Todos os Registros
                        </Link>
                    </div>
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            Total de registros
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary-hover)' }}>
                            {data?.totalEntries || 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
