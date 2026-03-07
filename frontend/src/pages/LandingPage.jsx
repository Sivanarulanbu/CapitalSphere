import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const features = [
    { icon: '🔐', title: 'Military-Grade Security', desc: 'Argon2 hashing, JWT tokens, OTP 2FA, and rate limiting keep your money safe.', color: 'rgba(37,99,235,0.1)', border: 'var(--border)' },
    { icon: '⚡', title: 'Instant Transfers', desc: 'Transfer funds in seconds to any CapitalSphere account. Atomic transactions ensure zero data loss.', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { icon: '🏦', title: 'Smart Loans', desc: 'Apply for personal, home, car or education loans with real-time EMI calculations.', color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { icon: '📊', title: 'Transaction History', desc: 'Full paginated history with filters, date ranges, and account statements.', color: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { icon: '🛡️', title: 'Admin Monitoring', desc: 'Role-based admin panel for user, account, and loan management.', color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    { icon: '📱', title: 'Modern Interface', desc: 'Beautiful dark-mode UI with smooth animations and a responsive design.', color: 'rgba(37,99,235,0.1)', border: 'var(--border)' },
];

const stats = [
    { value: '₹500Cr+', label: 'Deposits Managed' },
    { value: '2L+', label: 'Happy Customers' },
    { value: '99.99%', label: 'Uptime SLA' },
    { value: '0', label: 'Security Breaches' },
];

export default function LandingPage() {
    return (
        <div className="landing">
            {/* NAV */}
            <nav className="landing-nav">
                <Logo size={40} />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link to="/login" className="btn btn-ghost">Sign In</Link>
                    <Link to="/register" className="btn btn-primary">Open Account</Link>
                </div>
            </nav>

            {/* HERO */}
            <section className="landing-hero">
                <div className="hero-bg" style={{ background: 'radial-gradient(circle at top right, rgba(37,99,235,0.15) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(16,185,129,0.1) 0%, transparent 40%)' }} />
                <div className="hero-content slide-up">
                    <div className="hero-badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
                        🌐 Global Wealth, Digital Reach — Now in Beta
                    </div>
                    <h1 className="hero-title">
                        Banking That<br />
                        <span className="text-gradient">Moves Faster</span><br />
                        Than You
                    </h1>
                    <p className="hero-subtitle">
                        Experience seamless digital banking with instant transfers, smart loans,
                        and enterprise-grade security — all in one beautiful platform.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            🏦 Open Free Account
                        </Link>
                        <Link to="/login" className="btn btn-ghost btn-lg">
                            Sign In →
                        </Link>
                    </div>

                    {/* Floating card preview */}
                    <div style={{ marginTop: '3rem', display: 'inline-block', transform: 'perspective(1000px) rotateX(5deg)', filter: 'drop-shadow(0 40px 60px rgba(37,99,235,0.3))' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                            borderRadius: 20, padding: '1.5rem 2rem', minWidth: 320, textAlign: 'left',
                            position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                            <div style={{ background: 'rgba(255,215,0,0.9)', width: 44, height: 34, borderRadius: 6, marginBottom: '1rem' }} />
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', letterSpacing: '0.2em', opacity: 0.8, marginBottom: '0.5rem' }}>•••• •••• •••• 4721</div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800 }}>₹1,25,000.00</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600 }}>
                                <span>CAPITAL SAVINGS</span><span>03/29</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section style={{ padding: '3rem 4rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
                    {stats.map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif' " }} className="text-gradient">{s.value}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section className="features-section">
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                        Everything You Need,<br />
                        <span className="text-gradient">Nothing You Don't</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem', maxWidth: 520, margin: '0.75rem auto 0' }}>
                        A complete digital banking experience built with cutting-edge technology and a focus on security.
                    </p>
                </div>
                <div className="features-grid">
                    {features.map(f => (
                        <div key={f.title} className="feature-card" style={{ borderColor: f.border }}>
                            <div className="feature-icon" style={{ background: f.color }}>
                                <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '5rem 4rem', textAlign: 'center', background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>
                    Ready to Bank <span className="text-gradient">Smarter?</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
                    Join thousands who trust CapitalSphere for their daily banking needs. World-class experience, maximum security.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary btn-lg glow-anim">🚀 Get Started — It's Free</Link>
                    <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ padding: '2rem 4rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <Logo size={36} showText={true} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>© 2026 CapitalSphere. Digital Wealth, Global Reach.</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    {['Privacy', 'Terms', 'Security', 'Contact'].map(l => (
                        <a key={l} href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>{l}</a>
                    ))}
                </div>
            </footer>
        </div>
    );
}
