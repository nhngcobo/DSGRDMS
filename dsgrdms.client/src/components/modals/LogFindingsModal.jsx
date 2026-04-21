import { useState, useRef } from 'react';
import { X, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { fieldVisitsApi } from '../../services/fieldVisitsApi';
import './LogFindingsModal.css';

export default function LogFindingsModal({ visitId, grower, onClose, onSaved }) {
    const { showError, showSuccess } = useNotification();
    const fileInputRef = useRef(null);
    
    const [observations, setObservations] = useState('');
    const [activities, setActivities] = useState('');
    const [plantationCondition, setPlantationCondition] = useState('Good');
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = files.map((file, idx) => ({
            id: `photo-${Date.now()}-${idx}`,
            file,
            name: file.name,
            preview: URL.createObjectURL(file),
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
    };

    const removePhoto = (photoId) => {
        setPhotos(prev => {
            const photo = prev.find(p => p.id === photoId);
            if (photo?.preview) URL.revokeObjectURL(photo.preview);
            return prev.filter(p => p.id !== photoId);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!observations.trim() || !activities.trim()) {
            setError('Please fill in observations and activities');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Log findings to the visit
            await fieldVisitsApi.logFindings(visitId, {
                observations,
                activities,
                plantationCondition,
                notes: '' // Photo upload not implemented yet - frontend to backend integration
            });

            showSuccess(`Findings logged for ${grower?.name || 'grower'}`);
            onSaved();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to log findings');
            showError(err.message || 'Failed to log findings');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="findings-modal" role="dialog" aria-modal="true" aria-labelledby="findings-title">
                {/* Header */}
                <div className="findings-modal-header">
                    <div>
                        <h2 id="findings-title">Log Visit Findings</h2>
                        <p>{grower?.name || 'Grower'} · {grower?.id || 'ID'}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form className="findings-modal-body" onSubmit={handleSubmit}>
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Observations */}
                    <div className="findings-section">
                        <h3>Observations</h3>
                        <label htmlFor="observations">Key observations during the visit *</label>
                        <textarea
                            id="observations"
                            placeholder="Describe key observations, findings, issues, or notable conditions observed during the field visit..."
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    {/* Activities Performed */}
                    <div className="findings-section">
                        <h3>Activities Performed</h3>
                        <label htmlFor="activities">Silvicultural activities or interventions *</label>
                        <textarea
                            id="activities"
                            placeholder="e.g., Pruning, Weeding, Fertilization, Pest Control, Thinning, Harvesting, etc."
                            value={activities}
                            onChange={e => setActivities(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    {/* Plantation Condition */}
                    <div className="findings-section">
                        <h3>Plantation Condition Assessment</h3>
                        <label htmlFor="condition">Overall condition of the plantation *</label>
                        <select
                            id="condition"
                            value={plantationCondition}
                            onChange={e => setPlantationCondition(e.target.value)}
                            required
                        >
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>

                    {/* Photo Attachments */}
                    <div className="findings-section">
                        <h3>Photo Attachments</h3>
                        <label>Upload photos from the field visit</label>
                        
                        <div className="photo-upload-area">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="btn-upload-photos"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={20} />
                                <span>Click to upload photos</span>
                                <small>PNG, JPG up to 10MB each</small>
                            </button>
                        </div>

                        {photos.length > 0 && (
                            <div className="photo-gallery">
                                <h4>Uploaded Photos ({photos.length})</h4>
                                <div className="photo-grid">
                                    {photos.map(photo => (
                                        <div key={photo.id} className="photo-item">
                                            <img src={photo.preview} alt={photo.name} />
                                            <button
                                                type="button"
                                                className="btn-remove-photo"
                                                onClick={() => removePhoto(photo.id)}
                                                title="Remove photo"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="photo-name">{photo.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="findings-modal-footer">
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
                        {submitting ? 'Saving...' : 'Save Findings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
