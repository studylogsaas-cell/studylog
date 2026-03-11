import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

interface Material {
    type: string;
    title: string;
    details: string;
}

const MATERIAL_TYPES = [
    { value: 'livro', label: '📕 Livro' },
    { value: 'pdf', label: '📄 PDF' },
    { value: 'video', label: '🎥 Vídeo' },
    { value: 'plataforma', label: '💻 Plataforma' },
    { value: 'link', label: '🔗 Link' },
    { value: 'professor', label: '👨‍🏫 Professor' },
    { value: 'outro', label: '📌 Outro' },
];

export default function EntryFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');
    const [netHours, setNetHours] = useState('2.00');
    const [cycle, setCycle] = useState('');
    const [cycleDay, setCycleDay] = useState('');
    const [examId, setExamId] = useState('');
    const [examName, setExamName] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [summary, setSummary] = useState('');
    const [difficulty, setDifficulty] = useState(3);
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);

    const [exams, setExams] = useState<{ id: string; name: string }[]>([]);
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        Promise.all([api.getExams(), api.getSubjects()])
            .then(([e, s]) => { setExams(e); setSubjects(s); });

        if (isEdit && id) {
            setLoading(true);
            api.getEntry(id).then(entry => {
                setStudyDate(entry.studyDate);
                setStartTime(entry.startTime);
                setEndTime(entry.endTime);
                setNetHours(String(entry.netHours));
                setCycle(entry.cycle || '');
                setCycleDay(entry.cycleDay ? String(entry.cycleDay) : '');
                setExamId(entry.examId || '');
                setSubjectId(entry.subjectId || '');
                setSummary(entry.summary || '');
                setDifficulty(entry.difficulty);
                setTags(entry.tags || '');
                setNotes(entry.notes || '');
                setMaterials(entry.materials.map((m: any) => ({
                    type: m.type,
                    title: m.title,
                    details: m.details || '',
                })));
            }).finally(() => setLoading(false));
        }
    }, [id]);

    // Auto-calculate gross hours and suggest net hours
    useEffect(() => {
        if (startTime && endTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const diff = (eh * 60 + em - sh * 60 - sm) / 60;
            if (diff > 0 && !isEdit) {
                setNetHours(diff.toFixed(2));
            }
        }
    }, [startTime, endTime]);

    const addMaterial = () => {
        setMaterials([...materials, { type: 'livro', title: '', details: '' }]);
    };

    const removeMaterial = (index: number) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const updateMaterial = (index: number, field: keyof Material, value: string) => {
        const updated = [...materials];
        updated[index] = { ...updated[index], [field]: value };
        setMaterials(updated);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const data: any = {
                studyDate,
                startTime,
                endTime,
                netHours: parseFloat(netHours),
                cycle: cycle || undefined,
                cycleDay: cycleDay ? parseInt(cycleDay) : undefined,
                summary: summary || undefined,
                difficulty,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                notes,
                materials: materials.filter(m => m.title.trim()),
            };

            if (examId) {
                data.examId = examId;
            } else if (examName.trim()) {
                data.examName = examName.trim();
            }

            if (subjectId) {
                data.subjectId = subjectId;
            } else if (subjectName.trim()) {
                data.subjectName = subjectName.trim();
            }

            if (isEdit && id) {
                await api.updateEntry(id, data);
                navigate(`/entries/${id}`);
            } else {
                const created = await api.createEntry(data);
                navigate(`/entries/${created.id}`);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar registro');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <h1>{isEdit ? '✏️ Editar Registro' : '➕ Novo Registro de Estudo'}</h1>
                <p>{isEdit ? 'Atualize os dados da sua sessão' : 'Registre sua sessão de estudo'}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h3>📋 Estudo</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Linha 1: Data, Início, Término */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                                <label>Data</label>
                                <input type="date" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem' }} value={studyDate}
                                    onChange={e => setStudyDate(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                                <label>Início</label>
                                <input type="time" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem' }} value={startTime}
                                    onChange={e => setStartTime(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                                <label>Término</label>
                                <input type="time" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem' }} value={endTime}
                                    onChange={e => setEndTime(e.target.value)} required />
                            </div>
                        </div>

                        {/* Linha 2: Concurso e Disciplina */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                                <label>Concurso / Alvo</label>
                                <select className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem' }} value={examId}
                                    onChange={e => { setExamId(e.target.value); setExamName(''); }}>
                                    <option value="">Selecione...</option>
                                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                                {!examId && (
                                    <input type="text" className="form-control" style={{ marginTop: 8, padding: '8px 10px', fontSize: '0.85rem' }}
                                        placeholder="Novo concurso..."
                                        value={examName} onChange={e => setExamName(e.target.value)} />
                                )}
                            </div>
                            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                                <label>Disciplina</label>
                                <select className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem' }} value={subjectId}
                                    onChange={e => { setSubjectId(e.target.value); setSubjectName(''); }}>
                                    <option value="">Selecione...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {!subjectId && (
                                    <input type="text" className="form-control" style={{ marginTop: 8, padding: '8px 10px', fontSize: '0.85rem' }}
                                        placeholder="Nova disciplina..."
                                        value={subjectName} onChange={e => setSubjectName(e.target.value)} />
                                )}
                            </div>
                        </div>

                        {/* Linha 3: Horas Líquidas, Dificuldade, Ciclo */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div className="form-group" style={{ flex: '0 1 120px', marginBottom: 0 }}>
                                <label>Horas Líquidas</label>
                                <input type="number" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary-hover)' }} step="0.01" min="0"
                                    value={netHours} onChange={e => setNetHours(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                                <label>Ciclo (Opcional)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem', flex: 2 }} placeholder="Ex: Ciclo 1"
                                        value={cycle} onChange={e => setCycle(e.target.value)} />
                                    <input type="number" className="form-control" style={{ padding: '8px 10px', fontSize: '0.85rem', flex: 1 }} placeholder="Dia"
                                        min="1" value={cycleDay} onChange={e => setCycleDay(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                                <label>Dificuldade</label>
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <button key={i} type="button" onClick={() => setDifficulty(i)}
                                            style={{
                                                background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', outline: 'none',
                                                color: i <= difficulty ? 'var(--accent-warning)' : 'var(--border-light)',
                                                transition: 'color 0.2s ease'
                                            }}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0' }} />

                        {/* Bloco: Materiais Usados */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📚 Materiais Usados
                                </h4>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={addMaterial}>
                                    ➕ Adicionar Material
                                </button>
                            </div>
                            {materials.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, padding: '12px', background: 'var(--bg-light)', borderRadius: '6px', textAlign: 'center' }}>
                                    Nenhum material adicionado. Liste os materiais usados para manter seu histórico completo.
                                </p>
                            )}
                            {materials.map((mat, i) => (
                                <div key={i} className="material-item" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-light)', padding: '12px', borderRadius: '8px' }}>
                                    <select className="form-control" style={{ width: 140, marginBottom: 0, padding: '8px 10px', fontSize: '0.85rem' }} value={mat.type}
                                        onChange={e => updateMaterial(i, 'type', e.target.value)}>
                                        {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    <input type="text" className="form-control" placeholder="Título do material"
                                        value={mat.title} onChange={e => updateMaterial(i, 'title', e.target.value)}
                                        style={{ flex: 1, marginBottom: 0, padding: '8px 10px', fontSize: '0.85rem' }} />
                                    <input type="text" className="form-control" placeholder="Detalhes (ex: Cap. 1-3)"
                                        value={mat.details} onChange={e => updateMaterial(i, 'details', e.target.value)}
                                        style={{ flex: 1, marginBottom: 0, padding: '8px 10px', fontSize: '0.85rem' }} />
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeMaterial(i)} style={{ height: '36px', padding: '0 12px' }} title="Remover Material">
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header"><h3>📝 Anotações</h3></div>
                    <div className="form-group">
                        <label>Resumo do dia (curto)</label>
                        <input type="text" className="form-control"
                            placeholder="Ex: Estudei princípios constitucionais e resolvi 30 questões"
                            value={summary} onChange={e => setSummary(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Tags/Assuntos (separados por vírgula)</label>
                        <input type="text" className="form-control"
                            placeholder="Ex: revisão, questões, constitucional"
                            value={tags} onChange={e => setTags(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Anotações detalhadas</label>
                        <RichTextEditor content={notes} onChange={setNotes} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : isEdit ? '💾 Salvar Alterações' : '💾 Criar Registro'}
                    </button>
                </div>
            </form >
        </div >
    );
}
