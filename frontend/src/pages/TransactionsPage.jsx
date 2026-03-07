import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TransactionRow, { getBadgeClass, formatCurrency } from '../components/TransactionRow';
import { transactionService, accountService } from '../services/bankService';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionsPage() {
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [filters, setFilters] = useState({ account_id: '', transaction_type: '', date_from: '', date_to: '', status: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTxns = (p = 1) => {
        setLoading(true);
        const params = { page: p };
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        transactionService.getAll(params)
            .then(r => {
                if (r.data.results) {
                    setTxns(r.data.results);
                    setTotalPages(Math.ceil(r.data.count / 20));
                    setTotalCount(r.data.count);
                } else {
                    setTxns(r.data);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchTxns(page); }, [page]);
    useEffect(() => { setPage(1); fetchTxns(1); }, [filters]);

    useEffect(() => {
        accountService.getAll().then(r => setAccounts(r.data.results || r.data));
    }, []);

    const handleFilter = (e) => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

    return (
        <Layout title="Transactions">
            <div className="flex-between mb-3">
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Transaction History</h2>
                    <p className="text-secondary text-sm">{totalCount} transactions found</p>
                </div>
                <button className="btn btn-ghost btn-sm"><Download size={16} /> Export</button>
            </div>

            {/* Filters */}
            <div className="card mb-3">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Account</label>
                        <select name="account_id" className="form-control" value={filters.account_id} onChange={handleFilter}>
                            <option value="">All Accounts</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Type</label>
                        <select name="transaction_type" className="form-control" value={filters.transaction_type} onChange={handleFilter}>
                            <option value="">All Types</option>
                            <option value="transfer">Transfer</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                            <option value="loan_disbursement">Loan Disbursement</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select name="status" className="form-control" value={filters.status} onChange={handleFilter}>
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Date From</label>
                        <input type="date" name="date_from" className="form-control" value={filters.date_from} onChange={handleFilter} />
                    </div>
                    <div>
                        <label className="form-label">Date To</label>
                        <input type="date" name="date_to" className="form-control" value={filters.date_to} onChange={handleFilter} />
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="card">
                {loading ? (
                    <div className="loading-overlay"><span className="spinner" /></div>
                ) : txns.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3>No Transactions Found</h3>
                        <p>Try adjusting your filters</p>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Reference</th><th>Type</th><th>From</th><th>To</th>
                                        <th>Amount</th><th>Status</th><th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {txns.map(txn => (
                                        <tr key={txn.id}>
                                            <td><code style={{ fontSize: '0.78rem', color: 'var(--primary-light)' }}>{txn.reference_number}</code></td>
                                            <td style={{ textTransform: 'capitalize' }}>{txn.transaction_type.replace('_', ' ')}</td>
                                            <td className="text-secondary">{txn.sender_name || '—'}</td>
                                            <td className="text-secondary">{txn.receiver_name || '—'}</td>
                                            <td><strong style={{ color: 'var(--secondary)' }}>{formatCurrency(txn.amount)}</strong></td>
                                            <td><span className={`badge ${getBadgeClass(txn.status)}`}>{txn.status}</span></td>
                                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                {new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex-between" style={{ padding: '1rem 1.2rem', borderTop: '1px solid var(--border-light)' }}>
                                <span className="text-muted text-sm">Page {page} of {totalPages}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
