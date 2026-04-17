import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useT } from '../../hooks/useT';
import './UploadDocumentModal.css';

export default function UploadDocumentModal({ checklistItem, onClose, onSubmit }) {
    const t = useT();
    const tm = t.modals.uploadDocument;
    const [file, setFile] = useState(null);
    const inputRef = useRef();

    function handleFile(e) {
        setFile(e.target.files[0] ?? null);
    }

    function handleDrop(e) {
        e.preventDefault();
        setFile(e.dataTransfer.files[0] ?? null);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!file) return;
        onSubmit?.({ checklistItem, file });
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
                <div className="upload-modal-header">
                    <div>
                        <h2 id="upload-title">{tm.title}</h2>
                        <p>{tm.subtitle}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label={t.modals.close}>
                        <X size={18} />
                    </button>
                </div>

                <form className="upload-modal-body" onSubmit={handleSubmit}>
                    <div className="upload-form-group">
                        <label>{tm.checklistItemLabel}</label>
                        <div className="checklist-item-display">{checklistItem}</div>
                    </div>

                    <div className="upload-form-group">
                        <label>{tm.documentFileLabel}</label>
                        <div
                            className={'drop-zone' + (file ? ' has-file' : '')}
                            onClick={() => inputRef.current.click()}
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                        >
                            <Upload size={16} />
                            {file ? (
                                <span className="drop-zone-filename">{file.name}</span>
                            ) : (
                                <span>{tm.uploadPrompt}</span>
                            )}
                            <input
                                ref={inputRef}
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFile}
                            />
                        </div>
                    </div>

                    <div className="upload-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{tm.cancel}</button>
                        <button type="submit" className="btn-submit" disabled={!file}>
                            <Upload size={14} />
                            {tm.submitUpload}
                            Submit Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
