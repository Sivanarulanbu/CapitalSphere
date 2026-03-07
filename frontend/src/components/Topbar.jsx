import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ title }) {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <header className="topbar">
            <div>
                <div className="topbar-title">{title || `${greeting()}, ${user?.full_name?.split(' ')[0] || 'User'}`}</div>
                <div className="text-sm text-muted" style={{ marginTop: '0.1rem' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
            <div className="topbar-right">
                <button className="btn btn-icon btn-ghost" title="Toggle Theme" onClick={toggleTheme}>
                    {!isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button className="btn btn-icon btn-ghost" title="Notifications">
                    <Bell size={18} />
                </button>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                    {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
            </div>
        </header>
    );
}
