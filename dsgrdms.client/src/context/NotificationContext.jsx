import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import './Notification.css';

const NotificationContext = createContext(null);

let _nextId = 0;

export function NotificationProvider({ children }) {
    // Error modal — one at a time
    const [errorModal, setErrorModal] = useState(null);

    // Success toasts
    const [toasts, setToasts] = useState([]);

    // Confirm dialog
    const [confirmDialog, setConfirmDialog] = useState(null);
    const confirmResolveRef = useRef(null);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showError = useCallback((msg) => {
        setErrorModal({ id: ++_nextId, message: msg });
    }, []);

    const showSuccess = useCallback((msg) => {
        const id = ++_nextId;
        setToasts(prev => [...prev, { id, message: msg }]);
        setTimeout(() => dismissToast(id), 4000);
    }, [dismissToast]);

    // Returns a Promise<boolean> — true = confirmed, false = cancelled
    const showConfirm = useCallback((message, { confirmLabel = 'Confirm', danger = false } = {}) => {
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmDialog({ message, confirmLabel, danger });
        });
    }, []);

    function handleConfirmAnswer(answer) {
        confirmResolveRef.current?.(answer);
        confirmResolveRef.current = null;
        setConfirmDialog(null);
    }

    return (
        <NotificationContext.Provider value={{ showError, showSuccess, showConfirm }}>
            {children}

            {/* Error modal */}
            {errorModal && (
                <div className="err-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="err-modal-title">
                    <div className="err-modal">
                        <div className="err-modal-icon">
                            <AlertCircle size={32} />
                        </div>
                        <h2 id="err-modal-title" className="err-modal-title">Something went wrong</h2>
                        <p className="err-modal-msg">{errorModal.message}</p>
                        <button className="err-modal-btn" onClick={() => setErrorModal(null)}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm dialog */}
            {confirmDialog && (
                <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="confirm-modal">
                        <p id="confirm-title" className="confirm-msg">{confirmDialog.message}</p>
                        <div className="confirm-footer">
                            <button className="btn-cancel" onClick={() => handleConfirmAnswer(false)}>
                                Cancel
                            </button>
                            <button
                                className={'confirm-ok' + (confirmDialog.danger ? ' confirm-ok-danger' : '')}
                                onClick={() => handleConfirmAnswer(true)}
                            >
                                {confirmDialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success toasts */}
            <div className="notif-stack" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className="notif notif-success" role="status">
                        <div className="notif-icon"><CheckCircle size={18} /></div>
                        <div className="notif-body">
                            <p className="notif-title">Success</p>
                            <p className="notif-msg">{t.message}</p>
                        </div>
                        <button className="notif-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
                            <X size={14} />
                        </button>
                        <div className="notif-timer" />
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
    return ctx;
}
