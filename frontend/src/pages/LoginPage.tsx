import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import StudyLogLogo from '../components/StudyLogLogo';

export default function LoginPage() {
    const { login, register } = useAuth();
    const { theme, setTheme, themes } = useTheme();
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar requisição');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <StudyLogLogo size={56} />
                </div>
                <p className="auth-subtitle">
                    {isRegister ? 'Crie sua conta e comece a estudar' : 'Faça login para continuar'}
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="name">Nome</label>
                            <input
                                id="name"
                                type="text"
                                className="form-control"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-control"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Carregando...' : isRegister ? 'Cadastrar' : 'Entrar'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                        {isRegister ? 'Fazer login' : 'Cadastre-se'}
                    </button>
                </div>

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
                    <div className="theme-switcher">
                        {themes.map(t => (
                            <button
                                key={t.value}
                                className={theme === t.value ? 'active' : ''}
                                onClick={() => setTheme(t.value)}
                                title={t.label}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
