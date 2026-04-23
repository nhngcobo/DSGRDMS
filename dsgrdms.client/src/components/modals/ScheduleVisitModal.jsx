import { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { fieldVisitsApi } from '../../services/fieldVisitsApi';
import './ScheduleVisitModal.css';

export default function ScheduleVisitModal({ applicationId, growerId, grower, onClose, onScheduled }) {
    const { user } = useAuth();
    const { showError, showSuccess } = useNotification();
    
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [purpose, setPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Determine the actual grower ID from various prop formats
    const actualGrowerId = grower?.id || growerId || applicationId;

    const minDate = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedDate || !selectedTime || !purpose) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await fieldVisitsApi.scheduleVisit(actualGrowerId, {
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
                purpose,
            });

            showSuccess(`Visit scheduled for ${grower?.name || 'grower'} and assigned to ${user?.name || 'you'}`);
            onScheduled();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to schedule visit');
            showError(err.message || 'Failed to schedule visit');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-title">
                {/* Header */}
                <div className="schedule-modal-header">
                    <div>
                        <h2 id="schedule-title">Schedule Field Visit</h2>
                        <p>{grower?.name || 'Grower'} · {grower?.id || 'ID'}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form className="schedule-modal-body" onSubmit={handleSubmit}>
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Grower Info */}
                    <div className="schedule-section">
                        <h3>Grower Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name</label>
                                <p>{grower?.name}</p>
                            </div>
                            <div className="info-item">
                                <label>ID</label>
                                <p>{grower?.id}</p>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <p>{grower?.email || '—'}</p>
                            </div>
                            <div className="info-item">
                                <label>Phone</label>
                                <p>{grower?.phone || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Officer Assignment */}
                    <div className="schedule-section">
                        <h3>Officer Assignment</h3>
                        <div className="officer-assignment">
                            <User size={20} />
                            <div className="officer-details">
                                <span className="officer-name">{user?.name || 'Field Officer'}</span>
                                <span className="officer-email">{user?.email || 'No email'}</span>
                            </div>
                        </div>
                        <p className="assignment-note">This visit will be assigned to you</p>
                    </div>

                    {/* Visit Details */}
                    <div className="schedule-section">
                        <h3>Visit Details</h3>

                        <div className="form-group">
                            <label htmlFor="visit-date">
                                <Calendar size={16} />
                                Visit Date *
                            </label>
                            <input
                                id="visit-date"
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={minDate}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="visit-time">
                                <Clock size={16} />
                                Visit Time *
                            </label>
                            <input
                                id="visit-time"
                                type="time"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="visit-purpose">Purpose of Visit *</label>
                            <textarea
                                id="visit-purpose"
                                placeholder="e.g., Initial assessment, compliance check, follow-up, etc."
                                value={purpose}
                                onChange={e => setPurpose(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="schedule-modal-footer">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Scheduling...' : 'Schedule Visit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
