import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { accountService, adminService, loanService } from '../services/bankService';
import { getBadgeClass, formatCurrency } from '../components/TransactionRow';
import { useTheme } from '../context/ThemeContext';
import { Users, CreditCard, ArrowLeftRight, Landmark, Search, XCircle, CheckCircle, ShieldAlert, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import BalanceTicker from '../components/BalanceTicker';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [tab, setTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [txns, setTxns] = useState([]);
    const [flaggedTxns, setFlaggedTxns] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewForm, setReviewForm] = useState({ action: 'approve', approved_amount: '', interest_rate: '', rejection_reason: '', admin_notes: '' });
    const [reviewing, setReviewing] = useState(false);

    // Deposit Modal State
    const [depositModal, setDepositModal] = useState(null);
    const [depositForm, setDepositForm] = useState({ account_id: '', amount: '', description: 'Cash Deposit' });
    const [depositing, setDepositing] = useState(false);

    useEffect(() => {
        if (!user?.is_admin && user?.role !== 'loan_officer') { navigate('/dashboard'); return; }
        adminService.getDashboard().then(r => setStats(r.data)).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (tab === 'users') adminService.getUsers({ search }).then(r => setUsers(r.data.results || r.data));
        if (tab === 'transactions') adminService.getAllTransactions().then(r => setTxns(r.data.results || r.data));
        if (tab === 'loans') adminService.getAllLoans().then(r => setLoans(r.data.results || r.data));
        if (tab === 'fraud') adminService.getFlaggedTransactions().then(r => setFlaggedTxns(r.data.results || r.data));
        if (tab === 'ledger') adminService.getLedger().then(r => setLedger(r.data.results || r.data));
    }, [tab, search]);

    const handleToggleUser = async (id) => {
        await adminService.toggleUserStatus(id);
        adminService.getUsers({ search }).then(r => setUsers(r.data.results || r.data));
        toast.success('User status updated.');
    };

    const handleFreezeAccount = async (accountId, action) => {
        await adminService.freezeAccount(accountId, { action });
        toast.success(`Account ${action}d.`);
    };

    const handleLoanReview = async (e) => {
        e.preventDefault();
        setReviewing(true);
        try {
            // Only send fields relevant to the chosen action
            const submitData = {
                action: reviewForm.action,
                admin_notes: reviewForm.admin_notes
            };

            if (reviewForm.action === 'approve') {
                submitData.approved_amount = reviewForm.approved_amount;
                submitData.interest_rate = reviewForm.interest_rate;
            } else {
                submitData.rejection_reason = reviewForm.rejection_reason;
            }

            await loanService.review(reviewModal.id, submitData);
            toast.success(`Loan ${reviewForm.action}d!`);
            setReviewModal(null);
            adminService.getAllLoans().then(r => setLoans(r.data.results || r.data));
            // Trigger stats refresh
            adminService.getDashboard().then(r => setStats(r.data));
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData?.error || errData?.approved_amount?.[0] || errData?.interest_rate?.[0] || errData?.detail || 'Review failed.';
            toast.error(msg);
        } finally { setReviewing(false); }
    };

    const calcReviewEMI = () => {
        const P = parseFloat(reviewForm.approved_amount) || 0;
        const r = parseFloat(reviewForm.interest_rate) / (12 * 100) || 0;
        const n = reviewModal?.tenure_months || 0;
        if (!P || !n || !r) return '—';
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        return formatCurrency(emi.toFixed(2));
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositForm.account_id) { toast.error('Select an account'); return; }
        setDepositing(true);
        try {
            await adminService.deposit(depositForm.account_id, {
                amount: depositForm.amount,
                description: depositForm.description
            });
            toast.success('Funds deposited successfully!');
            setDepositModal(null);
            // Refresh stats and users
            adminService.getDashboard().then(r => setStats(r.data));
            adminService.getUsers({ search }).then(r => setUsers(r.data.results || r.data));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Deposit failed.');
        } finally { setDepositing(false); }
    };

    const statCards = stats ? [
        { label: 'Total Users', value: stats.users.total, isMoney: false, sub: `+${stats.users.new_this_week} this week`, icon: Users, cls: 'stat-icon-purple' },
        { label: 'Total Accounts', value: stats.accounts.total, isMoney: false, sub: `${stats.accounts.frozen} frozen`, icon: CreditCard, cls: 'stat-icon-teal' },
        { label: 'Total Deposits', value: stats.accounts.total_deposits, isMoney: true, sub: 'Across all accounts', icon: Landmark, cls: 'stat-icon-gold' },
        { label: 'Today Transactions', value: stats.transactions.today_count, isMoney: false, sub: formatCurrency(stats.transactions.today_volume) + ' volume', icon: ArrowLeftRight, cls: 'stat-icon-blue' },
        { label: 'Pending Loans', value: stats.loans.pending_review, isMoney: false, sub: 'Awaiting review', icon: Landmark, cls: 'stat-icon-red' },
        { label: 'Total Disbursed', value: stats.loans.total_disbursed, isMoney: true, sub: 'All time', icon: Landmark, cls: 'stat-icon-purple' },
    ] : [];

    const TABS = [
        { key: 'dashboard', label: 'Dashboard', icon: '📊' },
        ...(user?.is_admin ? [
            { key: 'users', label: 'Users', icon: '👥' },
            { key: 'transactions', label: 'Transactions', icon: '💸' },
            { key: 'fraud', label: 'Fraud Detection', icon: '🛡️' },
            { key: 'ledger', label: 'Ledger', icon: '📖' },
        ] : []),
        { key: 'loans', label: 'Loans', icon: '🏦' },
    ];

    return (
        <Layout title={user?.is_admin ? "Admin Panel" : "Loan Officer Portal"}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {tab === 'dashboard' && (
                <div className="slide-up">
                    <div className="flex-between mb-2">
                        <span className="section-title">System Overview</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Quick Theme Switch">
                                {isDarkMode ? '☀️ Day Mode' : '🌙 Night Mode'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => fetchStats()}>🔄 Refresh Stats</button>
                        </div>
                    </div>
                    {loading ? <div className="grid-3 mb-3">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="stat-card skeleton" style={{ height: 100 }} />)}
                    </div> : (
                        <div className="grid-3">
                            {statCards.map(s => (
                                <div key={s.label} className="stat-card">
                                    <div className={`stat-icon ${s.cls}`}><s.icon size={22} /></div>
                                    <div>
                                        <div className="stat-value">
                                            {s.isMoney ? <BalanceTicker value={s.value} /> : s.value}
                                        </div>
                                        <div className="stat-label">{s.label}</div>
                                        <div className="stat-change">{s.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
                <div className="slide-up">
                    <div className="flex-between mb-2">
                        <span className="section-title">All Users ({users.length})</span>
                        <div className="input-wrapper" style={{ width: 260 }}>
                            <Search className="input-icon" size={16} />
                            <input type="text" className="form-control" placeholder="Search name/email..."
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="card p-0">
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr><th>User</th><th>Email</th><th>Phone</th><th>KYC</th><th>Accounts</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td><strong>{u.full_name}</strong></td>
                                            <td className="text-secondary">{u.email}</td>
                                            <td>{u.phone || '—'}</td>
                                            <td><span className={`badge ${getBadgeClass(u.kyc_status)}`}>{u.kyc_status}</span></td>
                                            <td>{u.account_count}</td>
                                            <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={() => handleToggleUser(u.id)}>
                                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                {u.account_count > 0 && (
                                                    <button className="btn btn-sm btn-secondary" style={{ marginLeft: '0.4rem' }}
                                                        onClick={() => {
                                                            setDepositModal(u);
                                                            setDepositForm({ account_id: u.accounts[0].id, amount: '', description: 'Cash Deposit' });
                                                        }}>
                                                        Deposit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Tab */}
            {tab === 'transactions' && (
                <div className="slide-up">
                    <div className="section-title mb-2">All Transactions</div>
                    <div className="card p-0">
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr><th>Reference</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                                </thead>
                                <tbody>
                                    {txns.slice(0, 50).map(t => (
                                        <tr key={t.id}>
                                            <td><code style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>{t.reference_number}</code></td>
                                            <td style={{ textTransform: 'capitalize' }}>{t.transaction_type.replace('_', ' ')}</td>
                                            <td className="text-secondary">{t.sender_name || '—'}</td>
                                            <td className="text-secondary">{t.receiver_name || '—'}</td>
                                            <td><strong style={{ color: 'var(--secondary)' }}>{formatCurrency(t.amount)}</strong></td>
                                            <td><span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span></td>
                                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Fraud Tab */}
            {tab === 'fraud' && (
                <div className="slide-up">
                    <div className="flex-between mb-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="section-title">High Risk Monitoring</span>
                            <span className="badge badge-danger" style={{ borderRadius: '12px' }}>{flaggedTxns.length} Alerts</span>
                        </div>
                        <span className="text-secondary text-sm">Real-time fraud scoring active</span>
                    </div>

                    {flaggedTxns.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div style={{ fontSize: '2.5rem' }}>✅</div>
                                <h3>No Suspicious Activity</h3>
                                <p className="text-secondary">All recent transactions have passed security checks.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-0">
                            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                                <table>
                                    <thead>
                                        <tr><th>Reference</th><th>Risk Score</th><th>Sender</th><th>Amount</th><th>Reason</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {flaggedTxns.map(t => (
                                            <tr key={t.id}>
                                                <td><code style={{ fontSize: '0.78rem' }}>{t.reference_number}</code></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '40px', height: '6px', background: 'var(--border)', borderRadius: '3px', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '3px', background: 'var(--danger)', width: `${t.risk_score}%` }} />
                                                        </div>
                                                        <strong className="text-danger">{t.risk_score}</strong>
                                                    </div>
                                                </td>
                                                <td><strong>{t.sender_name}</strong></td>
                                                <td><strong style={{ color: 'var(--danger)' }}>{formatCurrency(t.amount)}</strong></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.82rem' }}>
                                                        <ShieldAlert size={14} />
                                                        {t.amount > 50000 ? 'High Value' : 'Rapid Velocity'}
                                                    </div>
                                                </td>
                                                <td className="text-muted">{new Date(t.created_at).toLocaleTimeString('en-IN')}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-sm btn-danger">Freeze User</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ledger Tab */}
            {tab === 'ledger' && (
                <div className="slide-up">
                    <div className="flex-between mb-2">
                        <span className="section-title">Double-Entry Ledger Audit</span>
                        <span className="text-secondary text-sm">Balanced accounting entries</span>
                    </div>
                    <div className="card p-0">
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr><th>Ref / Date</th><th>Account</th><th>Entry</th><th>Amount</th><th>Post-Balance</th><th>Description</th></tr>
                                </thead>
                                <tbody>
                                    {ledger.map(entry => (
                                        <tr key={entry.id}>
                                            <td>
                                                <code style={{ fontSize: '0.78rem' }}>{entry.reference}</code>
                                                <div className="text-xs text-muted">{new Date(entry.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            </td>
                                            <td>
                                                <strong>{entry.user_name}</strong>
                                                <div className="text-xs text-secondary">{entry.account_number}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${entry.entry_type === 'credit' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase', minWidth: '60px', textAlign: 'center' }}>
                                                    {entry.entry_type}
                                                </span>
                                            </td>
                                            <td>
                                                <strong style={{ color: entry.entry_type === 'credit' ? 'var(--secondary)' : 'var(--danger)' }}>
                                                    {entry.entry_type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                                                </strong>
                                            </td>
                                            <td><strong>{formatCurrency(entry.balance_after)}</strong></td>
                                            <td className="text-sm text-secondary">{entry.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Loans Tab */}
            {tab === 'loans' && (
                <div className="slide-up">
                    <div className="section-title mb-2">All Loan Applications</div>
                    <div className="card p-0">
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr><th>Applicant</th><th>Type</th><th>Requested</th><th>Tenure</th><th>Income</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {loans.map(l => (
                                        <tr key={l.id}>
                                            <td><strong>{l.user_name}</strong></td>
                                            <td style={{ textTransform: 'capitalize' }}>{l.loan_type.replace('_', ' ')}</td>
                                            <td>{formatCurrency(l.requested_amount)}</td>
                                            <td>{l.tenure_months}m</td>
                                            <td>{formatCurrency(l.monthly_income)}</td>
                                            <td><span className={`badge ${getBadgeClass(l.status)}`}>{l.status}</span></td>
                                            <td>
                                                {['pending', 'under_review'].includes(l.status) && (
                                                    <button className="btn btn-secondary btn-sm"
                                                        onClick={() => { setReviewModal(l); setReviewForm({ action: 'approve', approved_amount: l.requested_amount, interest_rate: '', rejection_reason: '', admin_notes: '' }); }}>
                                                        Review
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReviewModal(null)}>
                    <div className="modal slide-up">
                        <div className="modal-header">
                            <span className="modal-title">Review Loan Application</span>
                            <button className="modal-close" onClick={() => setReviewModal(null)}><XCircle size={20} /></button>
                        </div>
                        <div className="card" style={{ background: 'var(--bg-card2)', marginBottom: '1rem' }}>
                            <div className="info-row"><span className="info-key">Applicant</span><span className="info-val">{reviewModal.user_name}</span></div>
                            <div className="info-row"><span className="info-key">Loan Type</span><span className="info-val" style={{ textTransform: 'capitalize' }}>{reviewModal.loan_type.replace('_', ' ')}</span></div>
                            <div className="info-row"><span className="info-key">Requested</span><span className="info-val">{formatCurrency(reviewModal.requested_amount)}</span></div>
                            <div className="info-row"><span className="info-key">Purpose</span><span className="info-val">{reviewModal.purpose}</span></div>
                            <div className="info-row"><span className="info-key">Tenure</span><span className="info-val">{reviewModal.tenure_months} Months</span></div>
                            <div className="info-row"><span className="info-key">Monthly Income</span><span className="info-val">{formatCurrency(reviewModal.monthly_income)}</span></div>
                            <div className="info-row"><span className="info-key">Credit Account</span><span className="info-val" style={{ color: reviewModal.disbursement_account ? 'var(--success)' : 'var(--danger)' }}>
                                {reviewModal.disbursement_account_number || 'No Account Selected'}
                            </span></div>
                        </div>
                        <form onSubmit={handleLoanReview}>
                            <div className="form-group">
                                <label className="form-label">Decision</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setReviewForm(p => ({ ...p, action: 'approve' }))}
                                        className={`btn ${reviewForm.action === 'approve' ? 'btn-success' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button type="button" onClick={() => setReviewForm(p => ({ ...p, action: 'reject' }))}
                                        className={`btn ${reviewForm.action === 'reject' ? 'btn-danger' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                            {reviewForm.action === 'approve' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Approved Amount (₹)</label>
                                        <input type="number" className="form-control" value={reviewForm.approved_amount}
                                            onChange={e => setReviewForm(p => ({ ...p, approved_amount: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Interest Rate (% p.a.)</label>
                                        <input type="number" step="0.01" className="form-control" placeholder="10.5"
                                            value={reviewForm.interest_rate}
                                            onChange={e => setReviewForm(p => ({ ...p, interest_rate: e.target.value }))} required />
                                    </div>
                                </>
                            )}
                            {reviewForm.action === 'reject' && (
                                <div className="form-group">
                                    <label className="form-label">Rejection Reason</label>
                                    <textarea className="form-control" rows={3} value={reviewForm.rejection_reason}
                                        onChange={e => setReviewForm(p => ({ ...p, rejection_reason: e.target.value }))} required />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Admin Notes (Optional)</label>
                                <input type="text" className="form-control" value={reviewForm.admin_notes}
                                    onChange={e => setReviewForm(p => ({ ...p, admin_notes: e.target.value }))} />
                            </div>

                            {reviewForm.action === 'approve' && reviewForm.approved_amount && reviewForm.interest_rate > 0 && (
                                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                                    <span>📊</span>
                                    <div>
                                        <strong>Calculated EMI: {calcReviewEMI()}</strong>
                                        <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>User will pay this amount monthly for {reviewModal.tenure_months} months.</div>
                                    </div>
                                </div>
                            )}
                            <button type="submit" className={`btn btn-full ${reviewForm.action === 'approve' ? 'btn-success' : 'btn-danger'}`} disabled={reviewing}>
                                {reviewing ? <span className="spinner spinner-sm" /> : `Confirm ${reviewForm.action === 'approve' ? 'Approval' : 'Rejection'}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Deposit Modal */}
            {depositModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDepositModal(null)}>
                    <div className="modal slide-up">
                        <div className="modal-header">
                            <span className="modal-title">Manual Cash Deposit</span>
                            <button className="modal-close" onClick={() => setDepositModal(null)}><XCircle size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p className="text-secondary text-sm">Depositing funds for:</p>
                            <h3 style={{ margin: '0.25rem 0' }}>{depositModal.full_name}</h3>
                            <span className="badge badge-success">{depositModal.email}</span>
                        </div>
                        <form onSubmit={handleDeposit}>
                            <div className="form-group">
                                <label className="form-label">Select Account</label>
                                <select className="form-control" value={depositForm.account_id}
                                    onChange={e => setDepositForm(p => ({ ...p, account_id: e.target.value }))}>
                                    {depositModal.accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.account_number} ({acc.account_type.replace('_', ' ').toUpperCase()}) - ₹{acc.balance}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deposit Amount (₹)</label>
                                <input type="number" className="form-control" placeholder="Enter amount to credit"
                                    value={depositForm.amount}
                                    onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description / Remarks</label>
                                <input type="text" className="form-control" placeholder="e.g. Cash deposit at branch"
                                    value={depositForm.description}
                                    onChange={e => setDepositForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={depositing}>
                                {depositing ? <span className="spinner spinner-sm" /> : 'Complete Deposit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
