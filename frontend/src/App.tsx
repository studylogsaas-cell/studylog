import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EntriesPage from './pages/EntriesPage';
import EntryFormPage from './pages/EntryFormPage';
import EntryViewPage from './pages/EntryViewPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="entries" element={<EntriesPage />} />
                <Route path="entries/new" element={<EntryFormPage />} />
                <Route path="entries/:id/edit" element={<EntryFormPage />} />
                <Route path="entries/:id" element={<EntryViewPage />} />
            </Route>
        </Routes>
    );
}
