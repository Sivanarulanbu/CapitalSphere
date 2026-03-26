import { useEffect, useState } from 'react';
import { transactionService } from '../services/bankService';
import { formatCurrency } from './TransactionRow';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AutomatedPayments({ accounts, beneficiaries }) {
    const [scheduled, setScheduled] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        sender_account_id: '',
        receiver_account_number: '',
        amount: '',
        frequency: 'monthly',
        next_run_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const loadScheduled = () => {
        setLoading(true);
        transactionService.getScheduledTransfers()
            .then(res => setScheduled(res.data.results || res.data || []))
            .catch(() => toast.error("Failed to load automated payments"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadScheduled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await transactionService.createScheduledTransfer({
                sender_account: form.sender_account_id,
                receiver_account_number: form.receiver_account_number,
                amount: parseFloat(form.amount),
                frequency: form.frequency,
                next_run_date: form.next_run_date,
                description: form.description
            });
            toast.success("Automated Payment Scheduled!");
            setShowForm(false);
            loadScheduled();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to schedule payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this automated payment?")) return;
        try {
            await transactionService.deleteScheduledTransfer(id);
            toast.success("Scheduled payment cancelled");
            loadScheduled();
        } catch (err) {
            toast.error("Failed to cancel payment");
        }
    };

    if (showForm) {
        return (
            <form className="card slide-up" onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
                <h3 className="mb-3">New Automated Payment</h3>
                
                <div className="form-group">
                    <label className="form-label">From Account</label>
                    <select name="sender_account_id" className="form-control" value={form.sender_account_id} onChange={handleChange} required>
                        <option value="">Select Account</option>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.account_type.replace('_', ' ').toUpperCase()} •••• {a.account_number.slice(-4)} ({formatCurrency(a.balance)})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">To Account Number</label>
                    <input type="text" name="receiver_account_number" className="form-control" value={form.receiver_account_number} onChange={handleChange} required placeholder="Enter 10-digit account number" />
                </div>
                
                {beneficiaries.length > 0 && (
                    <div className="form-group">
                        <label className="form-label">Or Select Beneficiary</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {beneficiaries.map(b => (
                                <button key={b.id} type="button" className="btn btn-ghost btn-sm"
                                    onClick={() => setForm(p => ({ ...p, receiver_account_number: b.account_number }))}>
                                    {b.nickname || b.beneficiary_name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid-2 gap-2 mb-2">
                    <div className="form-group mb-0">
                        <label className="form-label">Amount (₹)</label>
                        <input type="number" name="amount" className="form-control" value={form.amount} onChange={handleChange} required min="1" step="0.01" />
                    </div>
                    <div className="form-group mb-0">
                        <label className="form-label">Frequency</label>
                        <select name="frequency" className="form-control" value={form.frequency} onChange={handleChange} required>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>

                <div className="grid-2 gap-2">
                    <div className="form-group mb-0">
                        <label className="form-label">Start Date</label>
                        <input type="date" name="next_run_date" className="form-control" value={form.next_run_date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group mb-0">
                        <label className="form-label">Note (Optional)</label>
                        <input type="text" name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="e.g. Rent, Subscriptions" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
                        {submitting ? 'Scheduling...' : 'Schedule Payment'}
                    </button>
                </div>
            </form>
        );
    }

    if (loading) return <div className="skeleton" style={{ height: 200, maxWidth: 700, margin: '0 auto', borderRadius: '1rem' }} />;

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="flex-between mb-3">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarClock className="text-secondary" /> Active Schedules
                </h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                    <Plus size={16} /> New Schedule
                </button>
            </div>

            {scheduled.length === 0 ? (
                <div className="card empty-state text-center slide-up">
                    <div style={{ fontSize: '3rem', margin: '0 auto 1rem', opacity: 0.5 }}>🔄</div>
                    <h3>No automated payments set up</h3>
                    <p className="text-secondary text-sm">Automate your regular transfers like rent, subscriptions, or savings allocations.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="slide-up">
                    {scheduled.map(item => (
                        <div key={item.id} className="card flex-between" style={{ borderLeft: '4px solid var(--secondary)' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{formatCurrency(item.amount)} <span className="text-muted text-sm" style={{ fontWeight: 400 }}>to {item.receiver_account_number}</span></h4>
                                <div className="text-sm text-secondary" style={{ display: 'flex', gap: '1rem' }}>
                                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{item.frequency}</span>
                                    <span>Next run: {new Date(item.next_run_date).toLocaleDateString()}</span>
                                    {item.description && <span>• {item.description}</span>}
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleCancel(item.id)}>
                                <Trash2 size={16} /> Cancel
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
