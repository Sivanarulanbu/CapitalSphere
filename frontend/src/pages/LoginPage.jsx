import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/bankService';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState('credentials'); // credentials | otp
    const [loginType, setLoginType] = useState('customer'); // customer | banker
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setErrors({});
        try {
            const { data } = await authService.login({ email, password, login_type: loginType });
            if (data.requires_otp) {
                toast.success('OTP sent to your email!');
                setStep('otp');
            } else if (data.requires_verification) {
                toast.error('Please verify your email first.');
                navigate('/verify-email', { state: { email } });
            }
        } catch (err) {
            const errData = err.response?.data;
            if (Array.isArray(errData?.non_field_errors)) {
                setErrors({ general: errData.non_field_errors[0] });
            } else {
                setErrors({ general: errData?.detail || 'Login failed. Check your credentials.' });
            }
        } finally { setLoading(false); }
    };

    const handleOtpChange = (val, idx) => {
        if (!/^\d*$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[idx] = val;
        setOtp(newOtp);
        if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            document.getElementById(`otp-${idx - 1}`)?.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
        setLoading(true);
        try {
            const { data } = await authService.loginVerifyOtp({ email, otp_code: code, purpose: 'login' });
            login({ access: data.access, refresh: data.refresh }, data.user);
            toast.success('Welcome back! Login successful.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid OTP.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            {/* Hero Panel */}
            <div className="auth-hero">
                <div className="auth-hero-content float-anim">
                    <Logo size={100} showText={false} centered={true} className="float-anim" />
                    <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginTop: '1.5rem' }}>CapitalSphere</h1>
                    <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                        Digital Wealth, Global Reach. Your secure gateway to modern finance.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {['Instant Transfers', 'Smart Loans', 'OTP Security', '24/7 Support'].map(f => (
                            <span key={f} className="hero-badge">{f}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Panel */}
            <div className="auth-form-panel">
                <div className="auth-form-box slide-up">
                    {step === 'credentials' ? (
                        <>
                            <h2>Welcome Back</h2>
                            <p>Sign in to your CapitalSphere account</p>

                            {/* Role Toggle */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                                <button type="button" onClick={() => setLoginType('customer')}
                                    className={`btn ${loginType === 'customer' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                    Customer
                                </button>
                                <button type="button" onClick={() => setLoginType('banker')}
                                    className={`btn ${loginType === 'banker' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>
                                    Banker (Staff)
                                </button>
                            </div>

                            {errors.general && <div className="alert alert-danger">{errors.general}</div>}

                            <form onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <div className="input-wrapper">
                                        <Mail className="input-icon" />
                                        <input
                                            type="email" className="form-control" placeholder="you@example.com"
                                            value={email} onChange={e => setEmail(e.target.value)} required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <div className="input-wrapper">
                                        <Lock className="input-icon" />
                                        <input
                                            type={showPass ? 'text' : 'password'} className="form-control"
                                            placeholder="••••••••" value={password}
                                            onChange={e => setPassword(e.target.value)} required
                                        />
                                        <button type="button" className="input-action" onClick={() => setShowPass(!showPass)}>
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" /> Remember me
                                    </label>
                                    <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', textDecoration: 'none' }}>
                                        Forgot password?
                                    </Link>
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                    {loading ? <span className="spinner spinner-sm" /> : <><ArrowRight size={18} /> Sign In</>}
                                </button>
                            </form>

                            <div className="auth-divider">or</div>
                            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                                    Create Account
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>Verify Your Identity</h2>
                            <p>Enter the 6-digit OTP sent to <strong>{email}</strong></p>

                            <form onSubmit={handleVerifyOtp}>
                                <div className="otp-group">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx} id={`otp-${idx}`}
                                            type="text" inputMode="numeric" maxLength={1}
                                            className="otp-input"
                                            value={digit}
                                            onChange={e => handleOtpChange(e.target.value, idx)}
                                            onKeyDown={e => handleOtpKeyDown(e, idx)}
                                        />
                                    ))}
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                    {loading ? <span className="spinner spinner-sm" /> : 'Verify & Login'}
                                </button>
                                <button type="button" className="btn btn-ghost btn-full mt-2" onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}>
                                    ← Back
                                </button>
                            </form>

                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Didn't receive OTP?{' '}
                                <button style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => authService.resendOtp({ email, purpose: 'login' }).then(() => toast.success('OTP resent!'))}>
                                    Resend
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
