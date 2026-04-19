import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { fetchGrowers } from '../../services/growersApi';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './LogVisitModal.css';

const today = new Date().toISOString().split('T')[0];

const EMPTY = {
    growerId:     '',
    growerName:   '',
    visitDate:    today,
    observations: '',
    activities:   '',
    condition:    '',
};

export default function LogVisitModal({ onClose, onSave }) {
    const { showError } = useNotification();
    const [form, setForm]         = useState(EMPTY);
    const [errors, setErrors]     = useState({});
    const [growers, setGrowers]   = useState([]);
    const [growerSearch, setGrowerSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [photoFile, setPhotoFile]       = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        fetchGrowers().then(setGrowers).catch(err => showError(friendlyError(err)));
    }, [showError]);

    const filteredGrowers = growers.filter(g =>
        g.name.toLowerCase().includes(growerSearch.toLowerCase())
    );

    function selectGrower(g) {
        setForm(f => ({ ...f, growerId: g.id, growerName: g.name }));
        setGrowerSearch('');
        setDropdownOpen(false);
        setErrors(prev => { const n = { ...prev }; delete n.growerId; return n; });
    }

    function set(key) {
        return e => {
            setForm(f => ({ ...f, [key]: e.target.value }));
            setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
        };
    }

    function handlePhoto(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    function validate() {
        const errs = {};
        if (!form.growerId)       errs.growerId   = 'Select a grower';
        if (!form.visitDate)      errs.visitDate  = 'Date is required';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSave({
            ...form,
            photoUrl: photoPreview ?? null,
        });
    }

    return (
        <div className="lv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="lv-modal" role="dialog" aria-modal="true" aria-labelledby="lv-title">

                {/* Header */}
                <div className="lv-header">
                    <div>
                        <h2 id="lv-title">Log New Field Visit</h2>
                        <p>Capture visit details, observations, and plantation data</p>
                    </div>
                    <button className="lv-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form className="lv-body" onSubmit={handleSubmit} noValidate>

                    {/* Grower selector */}
                    <div className={`lv-field ${errors.growerId ? 'has-error' : ''}`}>
                        <label className="lv-required">Grower</label>
                        <div className="lv-grower-dropdown">
                            <input
                                type="text"
                                className="lv-input"
                                placeholder="Search and select grower…"
                                value={form.growerId ? form.growerName : growerSearch}
                                onFocus={() => { setDropdownOpen(true); if (form.growerId) { setGrowerSearch(''); setForm(f => ({ ...f, growerId: '', growerName: '' })); } }}
                                onChange={e => { setGrowerSearch(e.target.value); setDropdownOpen(true); }}
                            />
                            {dropdownOpen && (
                                <ul className="lv-grower-list">
                                    {filteredGrowers.length === 0
                                        ? <li className="lv-grower-empty">No growers found</li>
                                        : filteredGrowers.map(g => (
                                            <li key={g.id} className="lv-grower-item" onMouseDown={() => selectGrower(g)}>
                                                <span>{g.name}</span>
                                                <span className="lv-grower-id">{g.id}</span>
                                            </li>
                                        ))
                                    }
                                </ul>
                            )}
                        </div>
                        {errors.growerId && <span className="lv-error">{errors.growerId}</span>}
                    </div>

                    {/* Visit Date */}
                    <div className={`lv-field ${errors.visitDate ? 'has-error' : ''}`}>
                        <label className="lv-required">Visit Date</label>
                        <input
                            type="date"
                            className="lv-input"
                            value={form.visitDate}
                            onChange={set('visitDate')}
                        />
                        {errors.visitDate && <span className="lv-error">{errors.visitDate}</span>}
                    </div>

                    {/* Observations */}
                    <div className="lv-field">
                        <label>Observations / Notes</label>
                        <textarea
                            className="lv-textarea"
                            rows={3}
                            placeholder="Describe key observations made during the visit…"
                            value={form.observations}
                            onChange={set('observations')}
                        />
                    </div>

                    {/* Silvicultural Activities */}
                    <div className="lv-field">
                        <label>Silvicultural Activities Performed</label>
                        <input
                            type="text"
                            className="lv-input"
                            placeholder="e.g. Pruning, Weeding, Fertilisation, Harvesting…"
                            value={form.activities}
                            onChange={set('activities')}
                        />
                    </div>

                    {/* Plantation Condition */}
                    <div className="lv-field">
                        <label>Plantation Condition Assessment</label>
                        <input
                            type="text"
                            className="lv-input"
                            placeholder="e.g. Good, Fair, Poor, Excellent"
                            value={form.condition}
                            onChange={set('condition')}
                        />
                    </div>

                    {/* Photo Attachments */}
                    <div className="lv-field">
                        <label>Photo Attachments</label>
                        <label className="lv-photo-upload">
                            {photoPreview
                                ? <img src={photoPreview} alt="Preview" className="lv-photo-preview" />
                                : <span>Click to upload an image</span>
                            }
                            <input
                                type="file"
                                accept="image/*"
                                className="lv-file-hidden"
                                onChange={handlePhoto}
                            />
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="lv-footer">
                        <button type="button" className="lv-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="lv-btn-save">
                            <CheckCircle size={14} />
                            Save Field Visit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
