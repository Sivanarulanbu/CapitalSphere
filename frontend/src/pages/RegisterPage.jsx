import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/bankService';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('form'); // form | otp
    const [registerType, setRegisterType] = useState('customer'); // customer | banker
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
        setErrors(p => ({ ...p, [e.target.name]: '' }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setErrors({});
        try {
            const payload = { ...formData, role: registerType === 'banker' ? 'loan_officer' : 'user' };
            await authService.register(payload);
            toast.success('Account created! Check your email for OTP.');
            setStep('otp');
        } catch (err) {
            const errData = err.response?.data || {};
            const flatErrors = {};
            Object.keys(errData).forEach(k => {
                flatErrors[k] = Array.isArray(errData[k]) ? errData[k][0] : errData[k];
            });
            setErrors(flatErrors);
        } finally { setLoading(false); }
    };

    const handleOtpChange = (val, idx) => {
        if (!/^\d*$/.test(val)) return;
        const newOtp = [...otp]; newOtp[idx] = val; setOtp(newOtp);
        if (val && idx < 5) document.getElementById(`otp-r-${idx + 1}`)?.focus();
    };
    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-r-${idx - 1}`)?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            await authService.verifyOtp({ email: formData.email, otp_code: code, purpose: 'registration' });
            toast.success('Email verified! You can now login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid OTP.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <div className="auth-hero-content float-anim">
                    <Logo size={80} showText={false} centered={true} className="float-anim" />
                    <h1 className="text-gradient" style={{ fontSize: '3rem' }}>Join CapitalSphere</h1>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        Elevate your wealth. Open your account in minutes.
                    </p>
                    <div style={{ marginTop: '2rem', textAlign: 'left', display: 'inline-block' }}>
                        {['Zero account opening fee', 'Instant account activation', 'Military-grade encryption', 'Dedicated 24/7 support'].map(b => (
                            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>✓</span> {b}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-box slide-up">
                    {step === 'form' ? (
                        <>
                            <h2>Create Account</h2>
                            <p>Fill in your details to get started</p>

                            {/* Role Toggle */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                                <button type="button" onClick={() => setRegisterType('customer')}
                                    className={`btn ${registerType === 'customer' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                    Customer
                                </button>
                                <button type="button" onClick={() => setRegisterType('banker')}
                                    className={`btn ${registerType === 'banker' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                    Banker (Staff)
                                </button>
                            </div>

                            {errors.non_field_errors && <div className="alert alert-danger">{errors.non_field_errors}</div>}

                            <form onSubmit={handleRegister}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" />
                                        <input type="text" name="full_name" className={`form-control ${errors.full_name ? 'error' : ''}`}
                                            placeholder="John Doe" value={formData.full_name} onChange={handleChange} required />
                                    </div>
                                    {errors.full_name && <span className="form-error">{errors.full_name}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" />
                                        <input type="email" name="email" className={`form-control ${errors.email ? 'error' : ''}`}
                                            placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    {errors.email && <span className="form-error">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <div className="input-wrapper">
                                        <Phone className="input-icon" />
                                        <input type="tel" name="phone" className={`form-control ${errors.phone ? 'error' : ''}`}
                                            placeholder="9876543210" value={formData.phone} onChange={handleChange} />
                                    </div>
                                    {errors.phone && <span className="form-error">{errors.phone}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <div className="input-wrapper">
                                        <Lock className="input-icon" />
                                        <input type={showPass ? 'text' : 'password'} name="password"
                                            className={`form-control ${errors.password ? 'error' : ''}`}
                                            placeholder="Min 8 characters" value={formData.password} onChange={handleChange} required />
                                        <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <span className="form-error">{errors.password}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <Lock className="input-icon" />
                                        <input type="password" name="confirm_password"
                                            className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                                            placeholder="Repeat password" value={formData.confirm_password} onChange={handleChange} required />
                                    </div>
                                    {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                    {loading ? <span className="spinner spinner-sm" /> : <><ArrowRight size={18} /> Create Account</>}
                                </button>
                            </form>
                            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>Verify Email</h2>
                            <p>Enter the 6-digit OTP sent to <strong>{formData.email}</strong></p>
                            <form onSubmit={handleVerify}>
                                <div className="otp-group">
                                    {otp.map((d, i) => (
                                        <input key={i} id={`otp-r-${i}`} type="text" inputMode="numeric" maxLength={1}
                                            className="otp-input" value={d}
                                            onChange={e => handleOtpChange(e.target.value, i)}
                                            onKeyDown={e => handleOtpKeyDown(e, i)} />
                                    ))}
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                    {loading ? <span className="spinner spinner-sm" /> : 'Verify & Continue'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
