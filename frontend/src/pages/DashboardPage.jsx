import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TransactionRow, { formatCurrency } from '../components/TransactionRow';
import { accountService, transactionService } from '../services/bankService';
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import BalanceTicker from '../components/BalanceTicker';
import VirtualCardWidget from '../components/VirtualCardWidget';

const COLORS = ['#6C63FF', '#00D4AA', '#FF6B6B', '#FFD700', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
const CAT_LABELS = {
    shopping: '🛍️ Shopping',
    food: '🍽️ Food',
    entertainment: '🎬 Entertainment',
    bills: '🧾 Bills',
    travel: '✈️ Travel',
    education: '🎓 Education',
    health: '🏥 Health',
    investment: '📈 Investment',
    loan: '🏦 Loan',
    other: '📦 Other'
};

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [recentTxns, setRecentTxns] = useState([]);
    const [analytics, setAnalytics] = useState({ spending: [], income: [] });
    const [virtualCard, setVirtualCard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            accountService.getDashboard(),
            transactionService.getRecent(),
            transactionService.getAnalytics(),
            accountService.getVirtualCards().catch(() => ({ data: [] }))
        ]).then(([dashRes, txnRes, anaRes, cardRes]) => {
            setDashboard(dashRes.data);
            const txns = txnRes.data.results || txnRes.data;
            setRecentTxns(Array.isArray(txns) ? txns : []);
            
            // Set Virtual Card
            const cards = cardRes?.data?.results || cardRes?.data || [];
            if (cards.length > 0) {
                setVirtualCard(cards[0]);
            }

            // Format analytics for Recharts
            const spendingData = (anaRes.data.spending || []).map(item => ({
                name: CAT_LABELS[item.category] || item.category,
                value: parseFloat(item.total)
            })).filter(item => item.value > 0);

            setAnalytics({ spending: spendingData });
        }).catch(err => {
            console.error("Dashboard load failed:", err);
        }).finally(() => setLoading(false));
    }, []);

    const getAccountTypeColor = (type) => {
        const map = { savings: 'bank-card-purple', current: 'bank-card-teal', fixed_deposit: 'bank-card-dark', salary: 'bank-card-purple' };
        return map[type] || 'bank-card-purple';
    };

    const handleCreateCard = async (accountId) => {
        try {
            setLoading(true);
            const res = await accountService.createVirtualCard({ account: accountId });
            setVirtualCard(res.data);
        } catch (error) {
            console.error("Failed to create card", error);
            alert("Failed to generate virtual card. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="grid-3 mb-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="stat-card skeleton" style={{ height: 100 }} />
                ))}
            </div>
            <div className="grid-2 mb-3">
                <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-lg)' }} />
                <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-lg)' }} />
            </div>
            <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
        </Layout>
    );

    return (
        <Layout>
            {/* Balance Overview */}
            <div className="grid-3 mb-3">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-purple"><Wallet size={22} /></div>
                    <div>
                        <div className="stat-value text-gradient">
                            <BalanceTicker value={dashboard?.total_balance || 0} />
                        </div>
                        <div className="stat-label">Total Balance</div>
                        <div className="stat-change up">↑ Across {dashboard?.account_count || 0} accounts</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-teal"><TrendingUp size={22} /></div>
                    <div>
                        <div className="stat-value" style={{ color: 'var(--secondary)' }}>{dashboard?.account_count || 0}</div>
                        <div className="stat-label">Active Accounts</div>
                        <div className="stat-change up">All accounts active</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-gold"><ArrowLeftRight size={22} /></div>
                    <div>
                        <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>{recentTxns.length}</div>
                        <div className="stat-label">Recent Transactions</div>
                        <div className="stat-change">Last 5 transactions</div>
                    </div>
                </div>
            </div>

            {/* Virtual Cards + Accounts */}
            <div className="grid-2 mb-3">
                {/* Virtual Card */}
                <div>
                    <div className="section-header">
                        <span className="section-title">My Virtual Card</span>
                    </div>
                    <VirtualCardWidget card={virtualCard} accounts={dashboard?.accounts} onCreate={handleCreateCard} loading={loading} />
                </div>

                {/* Account Cards */}
                <div>
                    <div className="section-header">
                        <span className="section-title">Bank Accounts</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/accounts')}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {dashboard?.accounts?.length === 0 ? (
                            <div className="card">
                                <div className="empty-state">
                                    <div className="empty-state-icon">🏦</div>
                                    <h3>No Accounts Yet</h3>
                                    <p>Open your first account to get started</p>
                                    <button className="btn btn-primary mt-2" onClick={() => navigate('/accounts')}>
                                        <Plus size={16} /> Open Account
                                    </button>
                                </div>
                            </div>
                        ) : (
                            dashboard?.accounts?.slice(0, 2).map(acc => (
                                <div key={acc.id} className={`bank-card ${getAccountTypeColor(acc.account_type)}`}
                                    onClick={() => navigate('/accounts')} style={{ cursor: 'pointer' }}>
                                    <div className="flex-between">
                                        <div className="bank-card-chip" />
                                        <span style={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {acc.account_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="bank-card-number">•••• •••• {acc.account_number.slice(-4)}</div>
                                        <div className="bank-card-balance">{formatCurrency(acc.balance)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions Matrix */}
            <div className="mb-3">
                <div className="section-header">
                    <span className="section-title">Quick Actions</span>
                </div>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { label: 'Send Money', icon: '💸', action: () => navigate('/transfer') },
                                { label: 'View Transactions', icon: '📋', action: () => navigate('/transactions') },
                                { label: 'Apply Loan', icon: '🏦', action: () => navigate('/loans') },
                                { label: 'My Profile', icon: '👤', action: () => navigate('/profile') },
                            ].map(({ label, icon, action }) => (
                                <button key={label} className="btn btn-ghost" onClick={action}
                                    style={{ flexDirection: 'column', height: '80px', gap: '0.4rem', fontSize: '0.82rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* KYC Banner overlaying next to Quick Actions theoretically, but keeping below for flow */}
                    {user?.kyc_status !== 'verified' && (
                        <div className="alert alert-warning">
                            <span>⚠️</span>
                            <div>
                                <strong>KYC Pending</strong>
                                <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                                    Complete KYC verification to unlock all features.
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            {/* AI Spending Insights */}
            <div className="grid-2 mb-3">
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">Spending Breakdown</span>
                        <TrendingDown size={18} className="text-danger" />
                    </div>
                    <div style={{ height: 260, width: '100%', position: 'relative' }}>
                        {analytics.spending.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.spending}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.spending.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state" style={{ padding: '2rem' }}>
                                <div style={{ fontSize: '2rem' }}>📊</div>
                                <p className="text-sm">No spending data yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="section-header">
                        <span className="section-title">Income Activity</span>
                        <TrendingUp size={18} className="text-success" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div className="alert alert-info" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Smart Budget Tip</div>
                                <div className="text-sm mt-1">Investing 20% of your income into "Investment" category can grow your wealth significantly.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)' }}>
                            <div>
                                <div className="text-muted text-xs">MONTHLY SPENT</div>
                                <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                                    <BalanceTicker value={analytics.spending.reduce((acc, curr) => acc + curr.value, 0)} />
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="text-muted text-xs">TOP CATEGORY</div>
                                <div className="text-gradient" style={{ fontWeight: 700 }}>
                                    {[...analytics.spending].sort((a, b) => b.value - a.value)[0]?.name.split(' ')[1] || 'None'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="section-header">
                    <span className="section-title">Recent Transactions</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')}>
                        View All <ChevronRight size={14} />
                    </button>
                </div>
                {recentTxns.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3>No Transactions Yet</h3>
                        <p>Your recent transactions will appear here</p>
                    </div>
                ) : (
                    recentTxns.map(txn => <TransactionRow key={txn.id} txn={txn} />)
                )}
            </div>
        </Layout>
    );
}
