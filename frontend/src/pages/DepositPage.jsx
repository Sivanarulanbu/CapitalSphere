import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { accountService, transactionService } from '../services/bankService';
import { formatCurrency } from '../components/TransactionRow';
import { ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepositPage() {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({
        account_id: '',
        amount: '',
        description: 'Online Deposit',
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [txnRef, setTxnRef] = useState('');

    useEffect(() => {
        accountService.getAll().then(r => {
            const list = r.data.results || r.data;
            setAccounts(list.filter(a => a.status === 'active'));
            if (list.length > 0) {
                setForm(p => ({ ...p, account_id: list[0].id }));
            }
        });
    }, []);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!form.account_id || !form.amount) { toast.error('Fill all required fields.'); return; }
        if (parseFloat(form.amount) <= 0) { toast.error('Amount must be greater than 0.'); return; }
        setLoading(true);
        try {
            const { data } = await transactionService.deposit({
                account_id: form.account_id,
                amount: parseFloat(form.amount),
                description: form.description,
            });
            setTxnRef(data.transaction?.reference_number);
            setDone(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Deposit failed.');
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setDone(false);
        setForm(p => ({ ...p, amount: '', description: 'Online Deposit' }));
    };

    if (done) return (
        <Layout title="Deposit Money">
            <div style={{ maxWidth: 480, margin: '3rem auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle2 size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Deposit Successful!</h2>
                    <p className="text-secondary">Your account has been credited.</p>
                    <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg-card2)' }}>
                        <div className="info-row"><span className="info-key">Amount</span><span className="info-val text-gradient">{formatCurrency(form.amount)}</span></div>
                        <div className="info-row"><span className="info-key">Reference</span><span className="info-val">{txnRef}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>New Deposit</button>
                    </div>
                </div>
            </div>
        </Layout>
    );

    return (
        <Layout title="Deposit Money">
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div className="card slide-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: 'var(--info)' }}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem' }}>Deposit to Account</h2>
                            <p className="text-secondary text-sm">Add funds safely to your balances.</p>
                        </div>
                    </div>

                    <form onSubmit={handleDeposit}>
                        <div className="form-group">
                            <label className="form-label">Select Destination Account</label>
                            <select name="account_id" className="form-control" value={form.account_id} onChange={handleChange} required>
                                <option value="" disabled>-- Select Your Account --</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_type.replace('_', ' ').toUpperCase()} •••• {acc.account_number.slice(-4)} (Bal: {formatCurrency(acc.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input type="number" name="amount" className="form-control"
                                placeholder="0.00" min="1" step="0.01"
                                value={form.amount} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description (Optional)</label>
                            <input type="text" name="description" className="form-control"
                                placeholder="E.g., Salary deposit, online top-up"
                                value={form.description} onChange={handleChange} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full mt-3" disabled={loading}>
                            {loading ? <span className="spinner spinner-sm" /> : <>Complete Deposit <ArrowRight size={16} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
