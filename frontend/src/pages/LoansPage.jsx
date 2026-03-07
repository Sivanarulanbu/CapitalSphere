import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { loanService, accountService } from '../services/bankService';
import { getBadgeClass, formatCurrency } from '../components/TransactionRow';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const LOAN_TYPES = [
    { value: 'personal', label: 'Personal Loan', icon: '💳', rate: '10.5%', max: '5L' },
    { value: 'home', label: 'Home Loan', icon: '🏠', rate: '7.5%', max: '50L' },
    { value: 'car', label: 'Car Loan', icon: '🚗', rate: '8.5%', max: '10L' },
    { value: 'education', label: 'Education Loan', icon: '🎓', rate: '9.0%', max: '20L' },
    { value: 'business', label: 'Business Loan', icon: '💼', rate: '12%', max: '25L' },
];

export default function LoansPage() {
    const [loans, setLoans] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApply, setShowApply] = useState(false);
    const [applying, setApplying] = useState(false);
    const [expandedLoan, setExpandedLoan] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [form, setForm] = useState({
        loan_type: 'personal', requested_amount: '', purpose: '',
        tenure_months: 12, monthly_income: '', employment_type: '',
        disbursement_account: '',
    });

    const fetchLoans = () => {
        setLoading(true);
        loanService.getAll()
            .then(r => setLoans(r.data.results || r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLoans(); }, []);
    useEffect(() => {
        accountService.getAll().then(r => {
            const list = r.data.results || r.data;
            setAccounts(list.filter(a => a.status === 'active'));
        });
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        try {
            await loanService.apply({ ...form, requested_amount: parseFloat(form.requested_amount), monthly_income: parseFloat(form.monthly_income), tenure_months: parseInt(form.tenure_months) });
            toast.success('Loan application submitted! We\'ll review it shortly.');
            setShowApply(false);
            fetchLoans();
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData?.requested_amount?.[0] || errData?.detail || errData?.non_field_errors?.[0] || 'Application failed.';
            toast.error(msg);
        } finally { setApplying(false); }
    };

    const toggleSchedule = async (loanId) => {
        if (expandedLoan === loanId) { setExpandedLoan(null); return; }
        setExpandedLoan(loanId);
        if (!schedule[loanId]) {
            const r = await loanService.getSchedule(loanId);
            setSchedule(p => ({ ...p, [loanId]: r.data.results || r.data }));
        }
    };

    // EMI calculator preview
    const calcEMI = () => {
        const P = parseFloat(form.requested_amount) || 0;
        const loanInfo = LOAN_TYPES.find(l => l.value === form.loan_type);
        const r = parseFloat(loanInfo?.rate) / (12 * 100) || 0;
        const n = parseInt(form.tenure_months) || 0;
        if (!P || !n || !r) return '—';
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        return formatCurrency(emi.toFixed(2));
    };

    return (
        <Layout title="Loans">
            <div className="flex-between mb-3">
                <div>
                    <h2 style={{ fontSize: '1.5rem' }}>Loan Applications</h2>
                    <p className="text-secondary text-sm">Apply for loans and track your applications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowApply(true)}>
                    <Plus size={18} /> Apply for Loan
                </button>
            </div>

            {/* Loan type cards */}
            <div className="grid-3 mb-3">
                {LOAN_TYPES.map(lt => (
                    <div key={lt.value} className="card" style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={() => { setForm(p => ({ ...p, loan_type: lt.value })); setShowApply(true); }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{lt.icon}</div>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{lt.label}</div>
                        <div className="text-muted text-sm">From {lt.rate} • Up to ₹{lt.max}</div>
                    </div>
                ))}
            </div>

            {/* Active applications */}
            <div className="card">
                <div className="section-title mb-2">My Applications</div>
                {loading ? (
                    <div className="loading-overlay"><span className="spinner" /></div>
                ) : loans.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏦</div>
                        <h3>No Loan Applications</h3>
                        <p>Apply for a loan to get started</p>
                    </div>
                ) : (
                    loans.map(loan => (
                        <div key={loan.id} className="card" style={{ marginBottom: '1rem', background: 'var(--bg-card2)' }}>
                            <div className="flex-between">
                                <div>
                                    <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{loan.loan_type.replace('_', ' ')} Loan</div>
                                    <div className="text-secondary text-sm">Applied: {new Date(loan.created_at).toLocaleDateString('en-IN')}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${getBadgeClass(loan.status)}`}>{loan.status}</span>
                                </div>
                            </div>
                            <div className="divider" style={{ margin: '0.75rem 0' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div><div className="text-muted text-xs">Requested</div><div style={{ fontWeight: 700 }}>{formatCurrency(loan.requested_amount)}</div></div>
                                {loan.approved_amount && <div><div className="text-muted text-xs">Approved</div><div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(loan.approved_amount)}</div></div>}
                                <div><div className="text-muted text-xs">Tenure</div><div style={{ fontWeight: 700 }}>{loan.tenure_months} months</div></div>
                                {loan.interest_rate && <div><div className="text-muted text-xs">Interest Rate</div><div style={{ fontWeight: 700 }}>{loan.interest_rate}% p.a.</div></div>}
                                {loan.emi_amount && <div><div className="text-muted text-xs">Monthly EMI</div><div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{formatCurrency(loan.emi_amount)}</div></div>}
                            </div>
                            {loan.status === 'disbursed' && (
                                <button className="btn btn-ghost btn-sm mt-2 w-full" onClick={() => toggleSchedule(loan.id)}>
                                    {expandedLoan === loan.id ? <><ChevronUp size={14} /> Hide Schedule</> : <><ChevronDown size={14} /> View EMI Schedule</>}
                                </button>
                            )}
                            {expandedLoan === loan.id && schedule[loan.id] && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead><tr><th>EMI #</th><th>Due Date</th><th>Amount</th><th>Principal</th><th>Interest</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {schedule[loan.id].slice(0, 12).map(emi => (
                                                    <tr key={emi.id}>
                                                        <td>{emi.emi_number}</td>
                                                        <td>{emi.due_date}</td>
                                                        <td>{formatCurrency(emi.amount)}</td>
                                                        <td className="text-secondary">{formatCurrency(emi.principal_component)}</td>
                                                        <td className="text-secondary">{formatCurrency(emi.interest_component)}</td>
                                                        <td><span className={`badge ${getBadgeClass(emi.status)}`}>{emi.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Apply Modal */}
            {showApply && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowApply(false)}>
                    <div className="modal slide-up" style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <span className="modal-title">Apply for Loan</span>
                            <button className="modal-close" onClick={() => setShowApply(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleApply}>
                            <div className="grid-2">
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Loan Type</label>
                                    <select className="form-control" value={form.loan_type} onChange={e => setForm(p => ({ ...p, loan_type: e.target.value }))}>
                                        {LOAN_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Loan Amount (₹)</label>
                                    <input type="number" className="form-control" placeholder="100000" min="10000"
                                        value={form.requested_amount} onChange={e => setForm(p => ({ ...p, requested_amount: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tenure (Months)</label>
                                    <select className="form-control" value={form.tenure_months} onChange={e => setForm(p => ({ ...p, tenure_months: e.target.value }))}>
                                        {[6, 12, 18, 24, 36, 48, 60, 84, 120].map(t => <option key={t} value={t}>{t} months</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Purpose</label>
                                    <input type="text" className="form-control" placeholder="Brief description of loan purpose"
                                        value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Monthly Income (₹)</label>
                                    <input type="number" className="form-control" placeholder="50000"
                                        value={form.monthly_income} onChange={e => setForm(p => ({ ...p, monthly_income: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employment Type</label>
                                    <select className="form-control" value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))}>
                                        <option value="">Select...</option>
                                        <option value="salaried">Salaried</option>
                                        <option value="self_employed">Self Employed</option>
                                        <option value="business">Business Owner</option>
                                        <option value="student">Student</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Disbursement Account</label>
                                    <select className="form-control" value={form.disbursement_account} onChange={e => setForm(p => ({ ...p, disbursement_account: e.target.value }))}>
                                        <option value="">Select account...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.account_type.replace('_', ' ')} - {a.account_number}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* EMI Preview */}
                            {form.requested_amount && (
                                <div className="alert alert-info">
                                    <span>📊</span>
                                    <div>
                                        <strong>Estimated Monthly EMI: {calcEMI()}</strong>
                                        <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>Based on the selected loan type's rate</div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-full" disabled={applying}>
                                {applying ? <span className="spinner spinner-sm" /> : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
