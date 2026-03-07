import logo from '../assets/logo/logo.png';

export default function Logo({ size = 42, showText = true, className = "", centered = false }) {
    return (
        <div
            className={`logo-wrapper ${className}`}
            style={{
                display: centered ? 'inline-flex' : 'flex',
                flexDirection: centered ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: centered ? 'center' : 'flex-start',
                gap: centered ? '1rem' : '0.75rem',
                textAlign: centered ? 'center' : 'left',
                margin: centered ? '0 auto' : '0'
            }}
        >
            <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000' // Pure black background for screen blending
            }}>
                <img
                    src={logo}
                    alt="CapitalSphere"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 10px rgba(0, 212, 170, 0.4))'
                    }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<span style="color: #00d4aa; font-weight: 900; font-family: Space Grotesk;">CS</span>';
                    }}
                />
            </div>
            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="logo-text text-gradient" style={{
                        fontSize: size > 60 ? '2.5rem' : '1.3rem',
                        lineHeight: 1.1,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                        CapitalSphere
                    </span>
                    {size > 60 && (
                        <span style={{
                            fontSize: '1rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            opacity: 0.8
                        }}>
                            Digital Wealth, Global Reach
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
