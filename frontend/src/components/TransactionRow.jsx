import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Landmark, Receipt } from 'lucide-react';

const iconMap = {
    credit: { Icon: ArrowDownLeft, cls: 'txn-icon-credit' },
    debit: { Icon: ArrowUpRight, cls: 'txn-icon-debit' },
    transfer: { Icon: ArrowLeftRight, cls: 'txn-icon-transfer' },
    loan_disbursement: { Icon: Landmark, cls: 'txn-icon-credit' },
    loan_repayment: { Icon: Landmark, cls: 'txn-icon-debit' },
    fee: { Icon: Receipt, cls: 'txn-icon-debit' },
};

export function getBadgeClass(status) {
    const map = {
        completed: 'badge-success',
        active: 'badge-success',
        approved: 'badge-success',
        disbursed: 'badge-success',
        pending: 'badge-warning',
        under_review: 'badge-info',
        failed: 'badge-danger',
        rejected: 'badge-danger',
        frozen: 'badge-danger',
        reversed: 'badge-warning',
        closed: 'badge-default',
    };
    return map[status] || 'badge-default';
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TransactionRow({ txn, userAccountIds = [] }) {
    const type = txn.transaction_type;
    const { Icon, cls } = iconMap[type] || iconMap.transfer;

    // Determine if credit or debit from user's perspective
    const isCredit = userAccountIds.some(id => txn.receiver_account_number?.includes('') || false) ||
        type === 'credit' || type === 'loan_disbursement';
    const amountClass = (type === 'credit' || type === 'loan_disbursement') ? 'credit' : 'debit';
    const amountSign = (type === 'credit' || type === 'loan_disbursement') ? '+' : '-';

    return (
        <div className="txn-row">
            <div className={`txn-icon-wrap ${cls}`}>
                <Icon size={20} />
            </div>
            <div className="txn-info">
                <div className="txn-title">{txn.description || `${type.replace('_', ' ')} #${txn.reference_number}`}</div>
                <div className="txn-subtitle">
                    {txn.sender_name && `${txn.sender_name} → `}
                    {txn.receiver_name && txn.receiver_name}
                    {' · '}{formatDate(txn.created_at)}
                </div>
            </div>
            <div className="flex-col" style={{ alignItems: 'flex-end', gap: '0.2rem' }}>
                <span className={`txn-amount ${amountClass}`}>
                    {amountSign}{formatCurrency(txn.amount)}
                </span>
                <span className={`badge ${getBadgeClass(txn.status)}`}>{txn.status}</span>
            </div>
        </div>
    );
}
