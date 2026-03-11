import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import DualMindMapEditor from '../components/DualMindMapEditor';

interface TreeNode {
    id: string;
    label: string;
    content: string;
    children: TreeNode[];
}

interface MindMap {
    id: string;
    title: string;
    treeData: string;
}

export default function EntryViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'mindmaps'>('notes');
    const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
    const [loadingMaps, setLoadingMaps] = useState(false);
    const [activeMindMap, setActiveMindMap] = useState<string | null>(null);
    const [editTree, setEditTree] = useState<TreeNode | null>(null);
    const [newMapTitle, setNewMapTitle] = useState('');
    const [showNewMapModal, setShowNewMapModal] = useState(false);
    const [mapToDelete, setMapToDelete] = useState<string | null>(null);
    const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false);
    const [savingMap, setSavingMap] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!id) return;
        api.getEntry(id).then(setEntry).catch(() => navigate('/entries')).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id || activeTab !== 'mindmaps') return;
        setLoadingMaps(true);
        api.getMindMaps(id).then(maps => {
            setMindMaps(maps);
            if (maps.length > 0 && !activeMindMap) {
                setActiveMindMap(maps[0].id);
                setEditTree(JSON.parse(maps[0].treeData));
            }
        }).finally(() => setLoadingMaps(false));
    }, [id, activeTab]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDuplicate = async () => {
        try {
            const dup = await api.duplicateEntry(id!);
            showToast('success', 'Registro duplicado com sucesso!');
            navigate(`/entries/${dup.id}`);
        } catch {
            showToast('error', 'Erro ao duplicar registro');
        }
    };

    const handleDelete = async () => {
        try {
            await api.deleteEntry(id!);
            navigate('/entries');
        } catch {
            showToast('error', 'Erro ao excluir registro');
            setShowDeleteEntryModal(false);
        }
    };

    const createMindMap = async () => {
        if (!newMapTitle.trim()) return;
        setSavingMap(true);
        try {
            const defaultTree: TreeNode = {
                id: '1',
                label: newMapTitle,
                content: '',
                children: [],
            };
            const created = await api.createMindMap(id!, {
                title: newMapTitle,
                treeData: defaultTree,
            });
            const maps = [...mindMaps, created];
            setMindMaps(maps);
            setActiveMindMap(created.id);
            setEditTree(JSON.parse(created.treeData));
            setShowNewMapModal(false);
            setNewMapTitle('');
            showToast('success', 'Mapa mental criado!');
        } catch {
            showToast('error', 'Erro ao criar mapa mental');
        } finally {
            setSavingMap(false);
        }
    };

    const saveMindMap = async () => {
        if (!activeMindMap || !editTree) return;
        setSavingMap(true);
        try {
            await api.updateMindMap(activeMindMap, { treeData: editTree });
            showToast('success', 'Mapa mental salvo!');
        } catch {
            showToast('error', 'Erro ao salvar mapa mental');
        } finally {
            setSavingMap(false);
        }
    };

    const confirmDeleteMindMap = async () => {
        if (!mapToDelete) return;
        try {
            await api.deleteMindMap(mapToDelete);
            const maps = mindMaps.filter(m => m.id !== mapToDelete);
            setMindMaps(maps);
            if (activeMindMap === mapToDelete) {
                if (maps.length > 0) {
                    setActiveMindMap(maps[0].id);
                    setEditTree(JSON.parse(maps[0].treeData));
                } else {
                    setActiveMindMap(null);
                    setEditTree(null);
                }
            }
            showToast('success', 'Mapa mental removido');
            setMapToDelete(null);
        } catch (err: any) {
            console.error('Delete mind map error:', err);
            showToast('error', err?.message || 'Erro ao remover mapa mental');
            setMapToDelete(null);
        }
    };

    const selectMindMap = (map: MindMap) => {
        setActiveMindMap(map.id);
        setEditTree(JSON.parse(map.treeData));
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!entry) return null;

    const tags = entry.tags ? entry.tags.split(',').filter(Boolean) : [];

    const renderStars = (d: number) => (
        <div className="difficulty">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`star ${i <= d ? '' : 'empty'}`}>★</span>
            ))}
        </div>
    );

    const formatDate = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    return (
        <div>
            {/* Header */}
            <div className="entry-detail-header">
                <div>
                    <div style={{ marginBottom: 8 }}>
                        <Link to="/entries" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            ← Voltar aos registros
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {entry.exam?.name || 'Sem concurso'} — {entry.subject?.name || 'Sem disciplina'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        {formatDate(entry.studyDate)} · {entry.startTime} às {entry.endTime}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to={`/entries/${id}/edit`} className="btn btn-secondary btn-sm">✏️ Editar</Link>
                    <button className="btn btn-secondary btn-sm" onClick={handleDuplicate}>📋 Duplicar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteEntryModal(true)}>🗑️ Excluir</button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="entry-summary-cards">
                <div className="summary-item">
                    <div className="label">Data</div>
                    <div className="value">{formatDate(entry.studyDate)}</div>
                </div>
                <div className="summary-item">
                    <div className="label">Horas Líquidas</div>
                    <div className="value" style={{ color: 'var(--accent-primary-hover)' }}>{entry.netHours}h</div>
                </div>
                <div className="summary-item">
                    <div className="label">Horas Brutas</div>
                    <div className="value">{entry.grossHours}h</div>
                </div>
                <div className="summary-item">
                    <div className="label">Dificuldade</div>
                    <div className="value">{renderStars(entry.difficulty)}</div>
                </div>
                {entry.cycle && (
                    <div className="summary-item">
                        <div className="label">Ciclo</div>
                        <div className="value">{entry.cycle}{entry.cycleDay ? ` · Dia ${entry.cycleDay}` : ''}</div>
                    </div>
                )}
            </div>

            {entry.summary && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        ✍️ "{entry.summary}"
                    </div>
                </div>
            )}

            {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}>
                    📝 Anotações & Materiais
                </button>
                <button className={`tab ${activeTab === 'mindmaps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mindmaps')}>
                    🧠 Mapas Mentais ({mindMaps.length || entry.mindMaps?.length || 0})
                </button>
            </div>

            {/* Tab content */}
            {activeTab === 'notes' && (
                <div>
                    {/* Materials */}
                    {entry.materials && entry.materials.length > 0 && (
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="card-header"><h3>📚 Materiais Utilizados</h3></div>
                            <div className="materials-list">
                                {entry.materials.map((m: any) => (
                                    <div key={m.id} className="material-item">
                                        <span className="material-type-badge">{m.type}</span>
                                        <div className="material-info">
                                            <div className="title">{m.title}</div>
                                            {m.details && <div className="details">{m.details}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {entry.notes ? (
                        <div className="card">
                            <div className="card-header"><h3>📝 Anotações</h3></div>
                            <div className="rich-content" dangerouslySetInnerHTML={{ __html: entry.notes }} />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="emoji">📝</div>
                            <h3>Sem anotações</h3>
                            <p>Clique em "Editar" para adicionar anotações a este registro.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'mindmaps' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {mindMaps.map(m => (
                                <button key={m.id}
                                    className={`btn btn-sm ${activeMindMap === m.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => selectMindMap(m)}>
                                    {m.title}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {activeMindMap && (
                                <>
                                    <button className="btn btn-sm btn-primary" onClick={saveMindMap} disabled={savingMap}>
                                        {savingMap ? '...' : '💾 Salvar'}
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => setMapToDelete(activeMindMap)}>
                                        🗑️
                                    </button>
                                </>
                            )}
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowNewMapModal(true)}>
                                ➕ Novo Mapa
                            </button>
                        </div>
                    </div>

                    {loadingMaps ? (
                        <div className="loading-spinner"><div className="spinner" /></div>
                    ) : editTree ? (
                        <DualMindMapEditor treeData={editTree} onChange={setEditTree} />
                    ) : (
                        <div className="empty-state">
                            <div className="emoji">🧠</div>
                            <h3>Nenhum mapa mental</h3>
                            <p>Crie um mapa mental para organizar os conceitos estudados.</p>
                            <button className="btn btn-primary" style={{ marginTop: 12 }}
                                onClick={() => setShowNewMapModal(true)}>
                                ➕ Criar Mapa Mental
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* New map modal */}
            {showNewMapModal && (
                <div className="modal-overlay" onClick={() => setShowNewMapModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Novo Mapa Mental</h2>
                        <div className="form-group">
                            <label>Título do mapa</label>
                            <input type="text" className="form-control" value={newMapTitle}
                                onChange={e => setNewMapTitle(e.target.value)}
                                placeholder="Ex: Princípios Constitucionais"
                                autoFocus />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowNewMapModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={createMindMap} disabled={!newMapTitle.trim()}>
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete map modal */}
            {mapToDelete && (
                <div className="modal-overlay" onClick={() => setMapToDelete(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗑️</div>
                            <h2>Excluir mapa mental?</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                                Essa ação não pode ser desfeita. Tem certeza que deseja remover este mapa mental?
                            </p>
                        </div>
                        <div className="modal-actions" style={{ justifyContent: 'center', gap: 16 }}>
                            <button className="btn btn-secondary" onClick={() => setMapToDelete(null)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={confirmDeleteMindMap}>
                                Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Entry Modal */}
            {showDeleteEntryModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteEntryModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
                            <h2>Excluir registro de estudo?</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                                Essa ação não pode ser desfeita. Tem certeza que deseja excluir este registro inteiro, incluindo todas as suas anotações e mapas mentais?
                            </p>
                        </div>
                        <div className="modal-actions" style={{ justifyContent: 'center', gap: 16 }}>
                            <button className="btn btn-secondary" onClick={() => setShowDeleteEntryModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                Sim, excluir registro
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>{toast.message}</div>
                </div>
            )}
        </div>
    );
}
