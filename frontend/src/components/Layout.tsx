import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import StudyLogLogo from './StudyLogLogo';

export default function Layout() {
    const { user, logout } = useAuth();
    const { theme, setTheme, themes } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    return (
        <div className="app-layout">
            {/* Mobile header */}
            <div className="mobile-header">
                <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
                <StudyLogLogo size={24} showText={false} />
                <div style={{ width: 36 }} />
            </div>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <StudyLogLogo size={38} />
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end onClick={closeSidebar}>
                        <span className="nav-icon">📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/entries" end onClick={closeSidebar}>
                        <span className="nav-icon">📝</span> Listar Registros
                    </NavLink>
                    <NavLink to="/entries/new" onClick={closeSidebar}>
                        <span className="nav-icon">➕</span> Novo Registro
                    </NavLink>
                </nav>

                <div className="sidebar-bottom">
                    {/* Theme switcher */}
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

                    <div className="sidebar-user" style={{ marginTop: 12 }}>
                        <div className="avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                    >
                        🚪 Sair
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                <div className="main-content-inner">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
