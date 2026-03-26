import { CreditCard, Eye, EyeOff, Plus, Wifi } from 'lucide-react';
import { useState } from 'react';

export default function VirtualCardWidget({ card, onCreate, accounts, loading }) {
    const [showDetails, setShowDetails] = useState(false);

    if (loading) {
        return <div className="skeleton" style={{ height: 220, borderRadius: '1.2rem' }} />;
    }

    if (!card) {
        return (
            <div className="card" style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '2px dashed var(--border)', background: 'var(--bg-card2)' }}>
                <CreditCard size={40} className="text-muted" />
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '0.25rem' }}>Virtual Debit Card</h3>
                    <p className="text-sm text-muted">Generate a card for secure online purchases.</p>
                </div>
                {accounts && accounts.length > 0 ? (
                    <button className="btn btn-primary" onClick={() => onCreate(accounts[0].id)}>
                        <Plus size={16} /> Generate Card
                    </button>
                ) : (
                    <p className="text-xs text-danger">Open an account first</p>
                )}
            </div>
        );
    }

    const formatCardNumber = (number) => {
        if (!showDetails) return `•••• •••• •••• ${number.slice(-4)}`;
        return number.replace(/(.{4})/g, '$1 ').trim();
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            borderRadius: '1.2rem',
            padding: '1.5rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease'
        }} className="glass-card bank-card-dark">
            {/* Background design accents */}
            <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
            
            <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
                <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, fontStyle: 'italic', letterSpacing: '1px' }}>VIRTUAL</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>CapitalSphere</div>
                </div>
                <Wifi size={24} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, marginTop: '1rem' }}>
                <div style={{ width: 45, height: 30, background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)', borderRadius: '4px', marginBottom: '1rem', opacity: 0.9, boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }}></div>
                <div style={{ fontSize: '1.4rem', letterSpacing: '3px', fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {formatCardNumber(card.card_number)}
                </div>
            </div>

            <div className="flex-between" style={{ position: 'relative', zIndex: 1, alignItems: 'flex-end', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase' }}>Valid Thru</div>
                        <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{showDetails ? card.expiry_date : '••/••'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.55rem', opacity: 0.7, textTransform: 'uppercase' }}>CVV</div>
                        <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{showDetails ? card.cvv : '•••'}</div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setShowDetails(!showDetails)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem', opacity: 0.8, outline: 'none' }} title="Toggle Details">
                        {showDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                        VISA
                    </div>
                </div>
            </div>
        </div>
    );
}
