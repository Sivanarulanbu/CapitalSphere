import api from './api';

export const authService = {
    register: (data) => api.post('/auth/register/', data),
    verifyOtp: (data) => api.post('/auth/verify-otp/', data),
    resendOtp: (data) => api.post('/auth/resend-otp/', data),
    login: (data) => api.post('/auth/login/', data),
    loginVerifyOtp: (data) => api.post('/auth/login/verify/', data),
    logout: (refresh) => api.post('/auth/logout/', { refresh }),
    getProfile: () => api.get('/auth/profile/'),
    updateProfile: (data) => api.patch('/auth/profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    setPin: (data) => api.post('/auth/set-pin/', data),
    forgotPassword: (data) => api.post('/auth/forgot-password/', data),
    resetPassword: (data) => api.post('/auth/reset-password/', data),
    uploadKYC: (formData) => api.post('/auth/profile/kyc/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getAuditLogs: () => api.get('/auth/profile/logs/'),
};

export const accountService = {
    getAll: () => api.get('/accounts/'),
    getDashboard: () => api.get('/accounts/dashboard/'),
    getDetail: (id) => api.get(`/accounts/${id}/`),
    create: (data) => api.post('/accounts/', data),
    getBeneficiaries: () => api.get('/accounts/beneficiaries/'),
    addBeneficiary: (data) => api.post('/accounts/beneficiaries/', data),
    removeBeneficiary: (id) => api.delete(`/accounts/beneficiaries/${id}/`),
    getVirtualCards: () => api.get('/accounts/cards/'),
    createVirtualCard: (data) => api.post('/accounts/cards/', data),
};

export const transactionService = {
    getAll: (params) => api.get('/transactions/', { params }),
    getRecent: () => api.get('/transactions/recent/'),
    getDetail: (id) => api.get(`/transactions/${id}/`),
    transfer: (data) => api.post('/transactions/transfer/', data),
    deposit: (data) => api.post('/transactions/deposit/', data),
    getStatement: (accountId, params) => api.get(`/transactions/statement/${accountId}/`, { params }),
    getAnalytics: () => api.get('/transactions/analytics/'),
    getScheduledTransfers: () => api.get('/transactions/scheduled/'),
    createScheduledTransfer: (data) => api.post('/transactions/scheduled/', data),
    deleteScheduledTransfer: (id) => api.delete(`/transactions/scheduled/${id}/`),
};

export const loanService = {
    getAll: () => api.get('/loans/'),
    getDetail: (id) => api.get(`/loans/${id}/`),
    apply: (data) => api.post('/loans/', data),
    getSchedule: (id) => api.get(`/loans/${id}/schedule/`),
    review: (id, data) => api.patch(`/loans/${id}/review/`, data),
};

export const adminService = {
    getDashboard: () => api.get('/admin/dashboard/'),
    getUsers: (params) => api.get('/admin/users/', { params }),
    getUser: (id) => api.get(`/admin/users/${id}/`),
    toggleUserStatus: (id) => api.post(`/admin/users/${id}/toggle-status/`),
    updateKYC: (id, data) => api.patch(`/admin/users/${id}/kyc/`, data),
    freezeAccount: (id, data) => api.post(`/admin/accounts/${id}/freeze/`, data),
    getAllTransactions: (params) => api.get('/admin/transactions/', { params }),
    getAllLoans: (params) => api.get('/admin/loans/', { params }),
    getFlaggedTransactions: () => api.get('/transactions/flagged/'),
    getLedger: () => api.get('/transactions/ledger/'),
    deposit: (accountId, data) => api.post(`/admin/accounts/${accountId}/deposit/`, data),
};
