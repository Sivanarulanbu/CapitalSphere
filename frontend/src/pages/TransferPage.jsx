import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { accountService, transactionService } from '../services/bankService';
import { formatCurrency } from '../components/TransactionRow';
import { ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Select Account', 'Enter Details', 'Confirm & Pay'];

export default function TransferPage() {
    const [step, setStep] = useState(0);
    const [accounts, setAccounts] = useState([]);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [form, setForm] = useState({
        sender_account_id: '',
        receiver_account_number: '',
        amount: '',
        description: '',
        pin: '',
    });
    const [senderAccount, setSenderAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [txnRef, setTxnRef] = useState('');

    useEffect(() => {
        accountService.getAll().then(r => {
            const list = r.data.results || r.data;
            setAccounts(list.filter(a => a.status === 'active'));
        });
        accountService.getBeneficiaries().then(r => setBeneficiaries(r.data.results || r.data));
    }, []);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const selectAccount = (acc) => {
        setForm(p => ({ ...p, sender_account_id: acc.id }));
        setSenderAccount(acc);
        setStep(1);
    };

    const goToConfirm = (e) => {
        e.preventDefault();
        if (!form.receiver_account_number || !form.amount) { toast.error('Fill all required fields.'); return; }
        if (parseFloat(form.amount) <= 0) { toast.error('Amount must be greater than 0.'); return; }
        setStep(2);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!form.pin) { toast.error('Enter your transaction PIN'); return; }
        setLoading(true);
        try {
            const { data } = await transactionService.transfer({
                sender_account_id: form.sender_account_id,
                receiver_account_number: form.receiver_account_number,
                amount: parseFloat(form.amount),
                pin: form.pin,
                description: form.description,
            });
            setTxnRef(data.transaction?.reference_number);
            setDone(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Transfer failed.');
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setStep(0); setDone(false);
        setForm({ sender_account_id: '', receiver_account_number: '', amount: '', description: '', pin: '' });
        setSenderAccount(null);
    };

    if (done) return (
        <Layout title="Transfer Money">
            <div style={{ maxWidth: 480, margin: '3rem auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle2 size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Transfer Successful!</h2>
                    <p className="text-secondary">Your money has been transferred securely.</p>
                    <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg-card2)' }}>
                        <div className="info-row"><span className="info-key">Amount</span><span className="info-val text-gradient">{formatCurrency(form.amount)}</span></div>
                        <div className="info-row"><span className="info-key">To Account</span><span className="info-val">{form.receiver_account_number}</span></div>
                        <div className="info-row"><span className="info-key">Reference</span><span className="info-val">{txnRef}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>New Transfer</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetForm}>Done</button>
                    </div>
                </div>
            </div>
        </Layout>
    );

    return (
        <Layout title="Transfer Money">
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Steps indicator */}
                <div className="steps mb-3">
                    {STEPS.map((label, i) => (
                        <div key={i} className="step-item">
                            <div className={`step-circle ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>
                <div className="text-sm text-muted mb-3" style={{ textAlign: 'center' }}>{STEPS[step]}</div>

                {/* Step 0: Choose source account */}
                {step === 0 && (
                    <div className="slide-up">
                        <h3 style={{ marginBottom: '1.25rem' }}>Select Source Account</h3>
                        {accounts.length === 0 ? (
                            <div className="card"><div className="empty-state"><p>No active accounts found.</p></div></div>
                        ) : (
                            accounts.map(acc => (
                                <div key={acc.id} className="card" style={{ marginBottom: '1rem', cursor: 'pointer', borderColor: form.sender_account_id === acc.id ? 'var(--primary)' : '' }}
                                    onClick={() => selectAccount(acc)}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{acc.account_type.replace('_', ' ').toUpperCase()}</div>
                                            <div className="text-secondary text-sm">•••• {acc.account_number.slice(-4)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--secondary)' }}>{formatCurrency(acc.balance)}</div>
                                            <div className="text-muted text-sm">Available</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Step 1: Enter transfer details */}
                {step === 1 && (
                    <form onSubmit={goToConfirm} className="slide-up">
                        <div className="card mb-2" style={{ background: 'var(--bg-card2)' }}>
                            <div className="flex-between">
                                <span className="text-secondary text-sm">From</span>
                                <span style={{ fontWeight: 700 }}>{formatCurrency(senderAccount?.balance)}</span>
                            </div>
                            <div style={{ fontWeight: 600 }}>{senderAccount?.account_type?.replace('_', ' ')} •••• {senderAccount?.account_number?.slice(-4)}</div>
                        </div>
                        <div className="card slide-up">
                            <div className="form-group">
                                <label className="form-label">Receiver Account Number</label>
                                <input type="text" name="receiver_account_number" className="form-control"
                                    placeholder="Enter 10-digit account number"
                                    value={form.receiver_account_number} onChange={handleChange} required />
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
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input type="number" name="amount" className="form-control"
                                    placeholder="0.00" min="1" step="0.01"
                                    value={form.amount} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <input type="text" name="description" className="form-control"
                                    placeholder="What's this for?"
                                    value={form.description} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(0)}>← Back</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                    Preview Transfer <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Step 2: Confirm & PIN */}
                {step === 2 && (
                    <form onSubmit={handleTransfer} className="slide-up">
                        <div className="card" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-light)', fontFamily: "'Space Grotesk', sans-serif", margin: '0.5rem 0' }}>
                                {formatCurrency(form.amount)}
                            </div>
                            <p className="text-secondary text-sm">Transfer amount</p>
                        </div>
                        <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-card2)' }}>
                            <div className="info-row"><span className="info-key">From</span><span className="info-val">{senderAccount?.account_type?.replace('_', ' ')} •••• {senderAccount?.account_number?.slice(-4)}</span></div>
                            <div className="info-row"><span className="info-key">To Account</span><span className="info-val">{form.receiver_account_number}</span></div>
                            {form.description && <div className="info-row"><span className="info-key">Note</span><span className="info-val">{form.description}</span></div>}
                            <div className="info-row"><span className="info-key">Available Balance</span><span className="info-val text-secondary">{formatCurrency(senderAccount?.balance)}</span></div>
                        </div>
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                <ShieldCheck size={18} color="var(--success)" />
                                Enter your 4-6 digit transaction PIN to authorize
                            </div>
                            <div className="form-group">
                                <label className="form-label">Transaction PIN</label>
                                <input type="password" name="pin" className="form-control"
                                    placeholder="••••" maxLength={6} inputMode="numeric"
                                    value={form.pin} onChange={handleChange} required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                                    {loading ? <span className="spinner spinner-sm" /> : 'Confirm Transfer'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}
