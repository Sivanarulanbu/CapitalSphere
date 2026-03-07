import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { accountService } from '../services/bankService';
import { formatCurrency, getBadgeClass } from '../components/TransactionRow';
import { Plus, X, CreditCard, Eye, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newAccount, setNewAccount] = useState({ account_type: 'savings', description: '' });

    const fetchAccounts = () => {
        setLoading(true);
        accountService.getAll()
            .then(r => setAccounts(r.data.results || r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAccounts(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await accountService.create(newAccount);
            toast.success('Account created successfully!');
            setShowCreate(false);
            setNewAccount({ account_type: 'savings', description: '' });
            fetchAccounts();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create account.');
        } finally { setCreating(false); }
    };

    const cardColors = {
        savings: 'linear-gradient(135deg, #6C63FF 0%, #3b5bdb 100%)',
        current: 'linear-gradient(135deg, #00D4AA 0%, #0069c8 100%)',
        fixed_deposit: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        salary: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    };

    return (
        <Layout title="My Accounts">
            <div className="flex-between mb-3">
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Bank Accounts</h2>
                    <p className="text-secondary text-sm">Manage all your CapitalSphere accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={18} /> Open Account
                </button>
            </div>

            {loading ? (
                <div className="loading-overlay"><span className="spinner" /></div>
            ) : accounts.length === 0 ? (
                <div className="card">
                    <div className="empty-state" style={{ padding: '4rem' }}>
                        <div className="empty-state-icon">🏦</div>
                        <h3>No Accounts Found</h3>
                        <p>Open your first account to start banking</p>
                        <button className="btn btn-primary mt-2" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Open Account
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Visual Cards Row */}
                    <div className="grid-2 mb-3">
                        {accounts.map(acc => (
                            <div key={acc.id}
                                style={{ background: cardColors[acc.account_type] || cardColors.savings, borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', overflow: 'hidden', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-card)', transition: 'var(--transition)' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ background: 'rgba(255,215,0,0.9)', width: 44, height: 34, borderRadius: 6, marginBottom: '1rem' }} />
                                        <div style={{ opacity: 0.8, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                                            {acc.account_type.replace('_', ' ')} Account
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                                        <Wifi size={18} />
                                        <span className={`badge ${getBadgeClass(acc.status)}`}>{acc.status}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', letterSpacing: '0.2em', opacity: 0.8, marginBottom: '0.5rem' }}>
                                        •••• •••• •••• {acc.account_number.slice(-4)}
                                    </div>
                                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800 }}>
                                        {formatCurrency(acc.balance)}
                                    </div>
                                    <div style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem' }}>Account No: {acc.account_number}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Accounts Table */}
                    <div className="card p-0">
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                            <span className="section-title">Account Details</span>
                        </div>
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Account Number</th><th>Holder Name</th><th>Type</th><th>Balance</th>
                                        <th>Interest Rate</th><th>Status</th><th>Opened</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(acc => (
                                        <tr key={acc.id}>
                                            <td><strong>{acc.account_number}</strong></td>
                                            <td>{user?.full_name || 'N/A'}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{acc.account_type.replace('_', ' ')}</td>
                                            <td><strong style={{ color: 'var(--secondary)' }}>{formatCurrency(acc.balance)}</strong></td>
                                            <td>{acc.interest_rate}% p.a.</td>
                                            <td><span className={`badge ${getBadgeClass(acc.status)}`}>{acc.status}</span></td>
                                            <td>{new Date(acc.created_at).toLocaleDateString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="modal slide-up">
                        <div className="modal-header">
                            <span className="modal-title">Open New Account</span>
                            <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Account Type</label>
                                <select className="form-control" value={newAccount.account_type}
                                    onChange={e => setNewAccount(p => ({ ...p, account_type: e.target.value }))}>
                                    <option value="savings">Savings Account</option>
                                    <option value="current">Current Account</option>
                                    <option value="fixed_deposit">Fixed Deposit</option>
                                    <option value="salary">Salary Account</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <input type="text" className="form-control" placeholder="e.g. Emergency Fund"
                                    value={newAccount.description}
                                    onChange={e => setNewAccount(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="alert alert-info">
                                <span>ℹ️</span>
                                <span>Your account will be activated instantly with a zero balance.</span>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
                                {creating ? <span className="spinner spinner-sm" /> : 'Open Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
