import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/bankService';
import { getBadgeClass } from '../components/TransactionRow';
import { User, Lock, Key, CheckCircle2, ShieldCheck, History, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [tab, setTab] = useState('profile');
    const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '' });
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [pinForm, setPinForm] = useState({ pin: '', confirm_pin: '' });
    const [kycForm, setKycForm] = useState({ document_type: 'aadhaar', document_number: '', front_image: null, back_image: null });
    const [auditLogs, setAuditLogs] = useState([]);
    const [saving, setSaving] = useState(false);

    const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await authService.updateProfile(profileForm);
            updateUser(data);
            toast.success('Profile updated!');
        } catch { toast.error('Update failed.'); }
        finally { setSaving(false); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error('Passwords do not match.'); return; }
        setSaving(true);
        try {
            await authService.changePassword(passwordForm);
            toast.success('Password changed!');
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
        finally { setSaving(false); }
    };

    const handlePinSet = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authService.setPin(pinForm);
            toast.success('Transaction PIN set!');
            setPinForm({ pin: '', confirm_pin: '' });
        } catch (err) { toast.error(err.response?.data?.confirm_pin || err.response?.data?.pin || 'Failed.'); }
        finally { setSaving(false); }
    };

    const handleKYCUpload = async (e) => {
        e.preventDefault();
        if (!kycForm.front_image) { toast.error('Front image is required'); return; }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('document_type', kycForm.document_type);
            formData.append('document_number', kycForm.document_number);
            formData.append('front_image', kycForm.front_image);
            if (kycForm.back_image) formData.append('back_image', kycForm.back_image);

            await authService.uploadKYC(formData);
            toast.success('KYC documents submitted!');
            updateUser({ ...user, kyc_status: 'pending' });
            setTab('profile');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed.');
        } finally { setSaving(false); }
    };

    const fetchLogs = async () => {
        try {
            const { data } = await authService.getAuditLogs();
            setAuditLogs(data.results || data);
        } catch { toast.error('Failed to load logs'); }
    };

    const tabs = [
        { key: 'profile', label: 'My Profile', icon: User },
        { key: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
        { key: 'password', label: 'Security', icon: Lock },
        { key: 'pin', label: 'PIN', icon: Key },
        { key: 'logs', label: 'Activity', icon: History },
    ];

    return (
        <Layout title="Account Settings">
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
                {/* Profile Header */}
                <div className="card mb-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="avatar avatar-lg">{initials}</div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{user?.full_name}</h2>
                            <div className="text-secondary text-sm">{user?.email}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                <span className={`badge ${getBadgeClass(user?.kyc_status)}`}>KYC: {user?.kyc_status}</span>
                                <span className={`badge ${user?.is_verified ? 'badge-success' : 'badge-warning'}`}>
                                    {user?.is_verified ? '✓ Verified' : 'Unverified'}
                                </span>
                                <span className="badge badge-purple">{user?.role?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Nav */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ flex: 1, gap: '0.4rem' }}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>

                {/* Tab: Profile */}
                {tab === 'profile' && (
                    <div className="card slide-up">
                        <div className="section-title mb-3">Personal Information</div>
                        <form onSubmit={handleProfileSave}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-control" value={profileForm.full_name}
                                        onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-control" value={user?.email} disabled
                                        style={{ opacity: 0.6 }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="tel" className="form-control" value={profileForm.phone}
                                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Account Role</label>
                                    <input type="text" className="form-control" value={user?.role?.replace('_', ' ')} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Address</label>
                                    <textarea className="form-control" rows={3} value={profileForm.address}
                                        onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                                        placeholder="Your full address..." />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="spinner spinner-sm" /> : 'Save Changes'}
                            </button>
                        </form>

                        <div className="divider" />
                        <div className="section-title mb-2">Account Details</div>
                        <div className="card" style={{ background: 'var(--bg-card2)' }}>
                            <div className="info-row"><span className="info-key">User ID</span><span className="info-val" style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{user?.id}</span></div>
                            <div className="info-row"><span className="info-key">Member Since</span><span className="info-val">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span></div>
                            <div className="info-row"><span className="info-key">KYC Status</span><span className={`badge ${getBadgeClass(user?.kyc_status)}`}>{user?.kyc_status}</span></div>
                            <div className="info-row"><span className="info-key">Verification</span><span className="info-val">{user?.is_verified ? '✓ Email Verified' : '✗ Not Verified'}</span></div>
                        </div>
                    </div>
                )}

                {/* Tab: Password */}
                {tab === 'password' && (
                    <div className="card slide-up">
                        <div className="section-title mb-3">Change Password</div>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-control" value={passwordForm.old_password}
                                    onChange={e => setPasswordForm(p => ({ ...p, old_password: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input type="password" className="form-control" value={passwordForm.new_password}
                                    onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} required minLength={8} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input type="password" className="form-control" value={passwordForm.confirm_password}
                                    onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} required />
                            </div>
                            <div className="alert alert-info">
                                <span>💡</span>
                                <span>Use at least 8 characters with a mix of letters, numbers, and symbols.</span>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="spinner spinner-sm" /> : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: PIN */}
                {tab === 'pin' && (
                    <div className="card slide-up">
                        <div className="section-title mb-3">Set Transaction PIN</div>
                        <p className="text-secondary text-sm mb-3">Your transaction PIN is required to authorize all fund transfers.</p>
                        <form onSubmit={handlePinSet}>
                            <div className="form-group">
                                <label className="form-label">New PIN (4-6 digits)</label>
                                <input type="password" inputMode="numeric" maxLength={6} className="form-control"
                                    placeholder="••••" value={pinForm.pin}
                                    onChange={e => setPinForm(p => ({ ...p, pin: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm PIN</label>
                                <input type="password" inputMode="numeric" maxLength={6} className="form-control"
                                    placeholder="••••" value={pinForm.confirm_pin}
                                    onChange={e => setPinForm(p => ({ ...p, confirm_pin: e.target.value }))} required />
                            </div>
                            <div className="alert alert-warning">
                                <span>⚠️</span>
                                <span>Never share your PIN with anyone. {user?.transaction_pin ? 'This will replace your existing PIN.' : ''}</span>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? <span className="spinner spinner-sm" /> : 'Set PIN'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: KYC */}
                {tab === 'kyc' && (
                    <div className="vertical-stack slide-up">
                        <div className="card">
                            <div className="section-header">
                                <span className="section-title">Identity Verification</span>
                                <span className={`badge ${getBadgeClass(user?.kyc_status)}`}>{user?.kyc_status}</span>
                            </div>

                            {user?.kyc_status === 'verified' ? (
                                <div className="empty-state">
                                    <div style={{ fontSize: '3rem', color: 'var(--success)' }}>✅</div>
                                    <h3>You are fully verified</h3>
                                    <p className="text-secondary">Your high-value transactions and credit limits are now active.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleKYCUpload}>
                                    <div className="alert alert-info mb-3">
                                        <span>📜</span>
                                        <span>Please upload clear images of your ID card for verification.</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Document Type</label>
                                        <select className="form-control" value={kycForm.document_type}
                                            onChange={e => setKycForm(p => ({ ...p, document_type: e.target.value }))}>
                                            <option value="aadhaar">Aadhaar Card</option>
                                            <option value="pan">PAN Card</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Document Number</label>
                                        <input type="text" className="form-control" placeholder="Enter ID number"
                                            value={kycForm.document_number}
                                            onChange={e => setKycForm(p => ({ ...p, document_number: e.target.value }))} required />
                                    </div>

                                    <div className="grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Front Image</label>
                                            <div className="file-upload-box" style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer' }}
                                                onClick={() => document.getElementById('front_img').click()}>
                                                {kycForm.front_image ? (
                                                    <div style={{ color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <CheckCircle2 size={24} style={{ margin: '0 auto' }} />
                                                        <span className="text-xs">{kycForm.front_image.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-secondary">
                                                        <Upload size={24} style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
                                                        <span className="text-xs">Click to upload front</span>
                                                    </div>
                                                )}
                                                <input id="front_img" type="file" hidden accept="image/*"
                                                    onChange={e => setKycForm(p => ({ ...p, front_image: e.target.files[0] }))} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Back Image (Optional)</label>
                                            <div className="file-upload-box" style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer' }}
                                                onClick={() => document.getElementById('back_img').click()}>
                                                {kycForm.back_image ? (
                                                    <div style={{ color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <CheckCircle2 size={24} style={{ margin: '0 auto' }} />
                                                        <span className="text-xs">{kycForm.back_image.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-secondary">
                                                        <Upload size={24} style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
                                                        <span className="text-xs">Click to upload back</span>
                                                    </div>
                                                )}
                                                <input id="back_img" type="file" hidden accept="image/*"
                                                    onChange={e => setKycForm(p => ({ ...p, back_image: e.target.files[0] }))} />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-full mt-2" disabled={saving}>
                                        {saving ? <span className="spinner spinner-sm" /> : 'Submit for Verification'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Logs */}
                {tab === 'logs' && (
                    <div className="card slide-up">
                        <div className="section-header">
                            <span className="section-title">Security & Activity Log</span>
                            <button className="btn btn-ghost btn-sm" onClick={fetchLogs}><History size={14} /> Refresh</button>
                        </div>
                        <div className="vertical-stack mt-2" style={{ gap: '0.75rem' }}>
                            {auditLogs.length === 0 ? (
                                <div className="empty-state" style={{ padding: '2rem' }}>
                                    <p className="text-secondary">No recent activity found. Click refresh to load.</p>
                                </div>
                            ) : (
                                auditLogs.map(log => (
                                    <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                                        <div style={{ background: log.is_success ? 'rgba(0, 212, 170, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: log.is_success ? 'var(--secondary)' : 'var(--danger)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                            {log.action === 'login' ? <Lock size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <strong style={{ fontSize: '0.9rem' }}>{log.action_display}</strong>
                                                <span className="text-xs text-muted">{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm text-secondary mt-1">{log.description}</div>
                                            <div className="text-xs text-muted mt-1">IP: {log.ip_address}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
