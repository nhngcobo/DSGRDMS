import { useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { registerGrower } from '../../services/growersApi';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './NewGrowerModal.css';

const EMPTY = {
    firstName: '', lastName: '', idNumber: '', phone: '', email: '',
    businessName: '', businessRegNumber: '',
    landTenure: '', treeSpecies: '', plantationSize: '', gpsLat: '', gpsLng: '',
};

export default function NewGrowerModal({ onClose, onSubmit }) {
    const t = useT();
    const tm = t.modals.newGrower;
    const tf = tm.fields;
    const { showError } = useNotification();
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function set(field) {
        return e => {
            const value = e.target.value;
            setForm(f => ({ ...f, [field]: value }));
            setErrors(prev => {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            });
        };
    }

    function setWithLiveValidation(field, validatorFn) {
        return e => {
            const value = e.target.value;
            setForm(f => ({ ...f, [field]: value }));
            setErrors(prev => {
                const error = validatorFn(value);
                if (!error) {
                    const next = { ...prev };
                    delete next[field];
                    return next;
                }
                return { ...prev, [field]: error };
            });
        };
    }

    const tv = tm.validation;

    function validateIdNumber(value) {
        if (!value.trim()) return null; // only show format errors while typing
        if (!/^\d+$/.test(value.trim())) return tv.idNumberFormat;
        if (value.trim().length > 13)    return tv.idNumberFormat;
        return null;
    }

    function handlePhoneChange(e) {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
        const full = digits ? '+27' + digits : '';
        setForm(f => ({ ...f, phone: full }));
        setErrors(prev => {
            const error = digits.length > 0 && digits.length < 9 ? tv.phoneFormat : null;
            if (!error) {
                const next = { ...prev };
                delete next.phone;
                return next;
            }
            return { ...prev, phone: error };
        });
    }

    function validate(data) {
        const errs = {};

        if (!data.firstName.trim())  errs.firstName = tv.required;
        if (!data.lastName.trim())   errs.lastName  = tv.required;

        if (!data.idNumber.trim())   errs.idNumber = tv.required;
        else if (!/^\d{13}$/.test(data.idNumber.trim())) errs.idNumber = tv.idNumberFormat;

        if (!data.phone)             errs.phone = tv.required;
        else if (!/^\+27\d{9}$/.test(data.phone)) errs.phone = tv.phoneFormat;

        if (!data.email.trim())      errs.email = tv.required;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = tv.emailFormat;

        if (!data.businessName.trim())   errs.businessName   = tv.required;
        if (!data.landTenure)            errs.landTenure     = tv.required;
        if (!data.treeSpecies)           errs.treeSpecies    = tv.required;

        if (!data.plantationSize.trim()) errs.plantationSize = tv.required;
        else if (parseFloat(data.plantationSize) <= 0) errs.plantationSize = tv.plantationSizeMin;

        if (data.gpsLat !== '') {
            const lat = parseFloat(data.gpsLat);
            if (isNaN(lat) || lat < -90  || lat > 90)   errs.gpsLat = tv.gpsLatRange;
        }
        if (data.gpsLng !== '') {
            const lng = parseFloat(data.gpsLng);
            if (isNaN(lng) || lng < -180 || lng > 180)  errs.gpsLng = tv.gpsLngRange;
        }

        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            await registerGrower(form);
            onSubmit?.();
            onClose();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSaveDraft() {
        setSubmitting(true);
        try {
            await registerGrower({ ...form, draft: true });
            onSubmit?.();
            onClose();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 id="modal-title">{tm.title}</h2>
                        <p>{tm.subtitle}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label={t.modals.close}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <form id="grower-form" onSubmit={handleSubmit} noValidate>

                        {/* Personal Details */}
                        <section className="form-section">
                            <h3>{tm.sections.personalDetails}</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{tf.firstName}</label>
                                    <input className={errors.firstName ? 'input-error' : ''} placeholder={tf.firstNamePlaceholder} value={form.firstName} onChange={set('firstName')} />
                                    {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                                </div>
                                <div className="form-group">
                                    <label>{tf.lastName}</label>
                                    <input className={errors.lastName ? 'input-error' : ''} placeholder={tf.lastNamePlaceholder} value={form.lastName} onChange={set('lastName')} />
                                    {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{tf.idNumber}</label>
                                    <input className={errors.idNumber ? 'input-error' : ''} placeholder={tf.idNumberPlaceholder} value={form.idNumber} onChange={setWithLiveValidation('idNumber', validateIdNumber)} />
                                    {errors.idNumber && <span className="field-error">{errors.idNumber}</span>}
                                </div>
                                <div className="form-group">
                                    <label>{tf.phone}</label>
                                    <div className={`phone-input-wrapper${errors.phone ? ' input-error' : ''}`}>
                                        <span className="phone-prefix">+27</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={9}
                                            placeholder="812345678"
                                            value={form.phone.replace(/^\+27/, '')}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                    {errors.phone && <span className="field-error">{errors.phone}</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{tf.email}</label>
                                <input type="email" className={errors.email ? 'input-error' : ''} placeholder={tf.emailPlaceholder} value={form.email} onChange={set('email')} />
                                {errors.email && <span className="field-error">{errors.email}</span>}
                            </div>
                        </section>

                        {/* Business Information */}
                        <section className="form-section">
                            <h3>{tm.sections.businessInfo}</h3>
                            <div className="form-group">
                                <label>{tf.businessName}</label>
                                <input className={errors.businessName ? 'input-error' : ''} placeholder={tf.businessNamePlaceholder} value={form.businessName} onChange={set('businessName')} />
                                {errors.businessName && <span className="field-error">{errors.businessName}</span>}
                            </div>
                            <div className="form-group">
                                <label>{tf.businessRegNumber}</label>
                                <input placeholder={tf.businessRegNumberPlaceholder} value={form.businessRegNumber} onChange={set('businessRegNumber')} />
                            </div>
                        </section>

                        {/* Plantation Details */}
                        <section className="form-section">
                            <h3>{tm.sections.plantationDetails}</h3>
                            <div className="form-group">
                                <label>{tf.landTenure}</label>
                                <select className={errors.landTenure ? 'input-error' : ''} value={form.landTenure} onChange={set('landTenure')}>
                                    <option value="" disabled>{tf.landTenurePlaceholder}</option>
                                    {tf.landTenureOptions.map(o => <option key={o}>{o}</option>)}
                                </select>
                                {errors.landTenure && <span className="field-error">{errors.landTenure}</span>}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{tf.treeSpecies}</label>
                                    <select className={errors.treeSpecies ? 'input-error' : ''} value={form.treeSpecies} onChange={set('treeSpecies')}>
                                        <option value="" disabled>{tf.treeSpeciesPlaceholder}</option>
                                        {tf.treeSpeciesOptions.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                    {errors.treeSpecies && <span className="field-error">{errors.treeSpecies}</span>}
                                </div>
                                <div className="form-group">
                                    <label>{tf.plantationSize}</label>
                                    <input type="number" min="0" step="0.1" className={errors.plantationSize ? 'input-error' : ''} placeholder={tf.plantationSizePlaceholder} value={form.plantationSize} onChange={set('plantationSize')} />
                                    {errors.plantationSize && <span className="field-error">{errors.plantationSize}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{tf.gpsLat}</label>
                                    <input className={errors.gpsLat ? 'input-error' : ''} placeholder={tf.gpsLatPlaceholder} value={form.gpsLat} onChange={set('gpsLat')} />
                                    {errors.gpsLat && <span className="field-error">{errors.gpsLat}</span>}
                                </div>
                                <div className="form-group">
                                    <label>{tf.gpsLng}</label>
                                    <input className={errors.gpsLng ? 'input-error' : ''} placeholder={tf.gpsLngPlaceholder} value={form.gpsLng} onChange={set('gpsLng')} />
                                    {errors.gpsLng && <span className="field-error">{errors.gpsLng}</span>}
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>{tm.cancel}</button>
                    <button type="button" className="btn-draft" onClick={handleSaveDraft} disabled={submitting}>{submitting ? '…' : tm.saveAsDraft}</button>
                    <button type="submit" form="grower-form" className="btn-submit" disabled={submitting}>{submitting ? '…' : tm.submitReview}</button>
                </div>
            </div>
        </div>
    );
}
