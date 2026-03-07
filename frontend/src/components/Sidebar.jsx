import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, CreditCard, ArrowLeftRight, FileText,
    Landmark, User, LogOut, Shield, ChevronRight, Wallet
} from 'lucide-react';
import Logo from './Logo';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/accounts', icon: CreditCard, label: 'Accounts' },
    { to: '/deposit', icon: Wallet, label: 'Deposit' },
    { to: '/transfer', icon: ArrowLeftRight, label: 'Transfer' },
    { to: '/transactions', icon: FileText, label: 'Transactions' },
    { to: '/loans', icon: Landmark, label: 'Loans' },
    { to: '/profile', icon: User, label: 'Profile' },
];

const adminItems = [
    { to: '/admin', icon: Shield, label: 'Admin / Staff Panel' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Logo size={40} />
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="nav-icon" />
                        {label}
                    </NavLink>
                ))}

                {(user?.is_admin || user?.role === 'loan_officer') && (
                    <>
                        <div className="nav-section-label" style={{ marginTop: '1rem' }}>Staff Portal</div>
                        {adminItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon className="nav-icon" />
                                {label}
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-mini">
                    <div className="avatar">{initials}</div>
                    <div className="user-mini-info">
                        <div className="user-mini-name">{user?.full_name || 'User'}</div>
                        <div className="user-mini-role">{user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : user?.role === 'loan_officer' ? 'Loan Officer' : 'Customer'}</div>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={handleLogout} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
