import { useState } from 'react';
import { X } from 'lucide-react';
import { updateGrower } from '../../services/growersApi';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './EditGrowerModal.css';

export default function EditGrowerModal({ grower, onClose, onSaved }) {
    const { showError, showSuccess } = useNotification();

    const [form, setForm] = useState({
        phone:             grower.phone             ?? '',
        email:             grower.email             ?? '',
        businessName:      grower.businessName      ?? '',
        businessRegNumber: grower.businessRegNumber ?? '',
        landTenure:        grower.landTenure        ?? '',
        treeSpecies:       grower.treeSpecies       ?? '',
        plantationSize:    grower.gpsLat != null    ? '' : '',   // resolved below
        gpsLat:            grower.gpsLat != null    ? String(grower.gpsLat) : '',
        gpsLng:            grower.gpsLng != null    ? String(grower.gpsLng) : '',
    });

    // Derive plantationSize string from the "X ha" display value
    useState(() => {
        const raw = grower.farmSize ?? '';
        const num = parseFloat(raw);
        setForm(f => ({ ...f, plantationSize: isNaN(num) ? '' : String(num) }));
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function set(field) {
        return e => {
            setForm(f => ({ ...f, [field]: e.target.value }));
            setErrors(prev => {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            });
        };
    }

    function validate() {
        const errs = {};
        if (!form.phone.trim()) errs.phone = 'Phone is required.';
        if (form.gpsLat && isNaN(parseFloat(form.gpsLat))) errs.gpsLat = 'Must be a number.';
        if (form.gpsLng && isNaN(parseFloat(form.gpsLng))) errs.gpsLng = 'Must be a number.';
        if (form.plantationSize && isNaN(parseFloat(form.plantationSize))) errs.plantationSize = 'Must be a number.';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const updated = await updateGrower(grower.id, form);
            showSuccess('Grower details updated.');
            onSaved(updated);
            onClose();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">

                {/* Header */}
                <div className="edit-modal-header">
                    <div>
                        <h2 id="edit-modal-title">Edit Grower</h2>
                        <p>{grower.name} · {grower.id}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form id="edit-grower-form" className="edit-modal-body" onSubmit={handleSubmit}>

                    {/* Contact */}
                    <fieldset className="edit-section">
                        <legend>Contact</legend>
                        <div className="edit-row">
                            <div className={'edit-field' + (errors.phone ? ' has-error' : '')}>
                                <label>Phone *</label>
                                <input type="tel" value={form.phone} onChange={set('phone')} />
                                {errors.phone && <span className="edit-error">{errors.phone}</span>}
                            </div>
                            <div className="edit-field">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={set('email')} />
                            </div>
                        </div>
                    </fieldset>

                    {/* Business */}
                    <fieldset className="edit-section">
                        <legend>Business</legend>
                        <div className="edit-row">
                            <div className="edit-field">
                                <label>Business Name</label>
                                <input type="text" value={form.businessName} onChange={set('businessName')} />
                            </div>
                            <div className="edit-field">
                                <label>Reg Number</label>
                                <input type="text" value={form.businessRegNumber} onChange={set('businessRegNumber')} />
                            </div>
                        </div>
                    </fieldset>

                    {/* Farm */}
                    <fieldset className="edit-section">
                        <legend>Farm Details</legend>
                        <div className="edit-row">
                            <div className="edit-field">
                                <label>Land Tenure</label>
                                <input type="text" value={form.landTenure} onChange={set('landTenure')} />
                            </div>
                            <div className="edit-field">
                                <label>Tree Species</label>
                                <input type="text" value={form.treeSpecies} onChange={set('treeSpecies')} />
                            </div>
                        </div>
                        <div className="edit-row">
                            <div className={'edit-field' + (errors.plantationSize ? ' has-error' : '')}>
                                <label>Plantation Size (ha)</label>
                                <input type="number" step="0.01" min="0" value={form.plantationSize} onChange={set('plantationSize')} />
                                {errors.plantationSize && <span className="edit-error">{errors.plantationSize}</span>}
                            </div>
                        </div>
                    </fieldset>

                    {/* GPS */}
                    <fieldset className="edit-section">
                        <legend>GPS Coordinates</legend>
                        <div className="edit-row">
                            <div className={'edit-field' + (errors.gpsLat ? ' has-error' : '')}>
                                <label>Latitude</label>
                                <input type="number" step="any" value={form.gpsLat} onChange={set('gpsLat')} placeholder="-90 to 90" />
                                {errors.gpsLat && <span className="edit-error">{errors.gpsLat}</span>}
                            </div>
                            <div className={'edit-field' + (errors.gpsLng ? ' has-error' : '')}>
                                <label>Longitude</label>
                                <input type="number" step="any" value={form.gpsLng} onChange={set('gpsLng')} placeholder="-180 to 180" />
                                {errors.gpsLng && <span className="edit-error">{errors.gpsLng}</span>}
                            </div>
                        </div>
                    </fieldset>
                </form>

                {/* Footer */}
                <div className="edit-modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button type="submit" form="edit-grower-form" className="btn-submit" disabled={submitting}>
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
