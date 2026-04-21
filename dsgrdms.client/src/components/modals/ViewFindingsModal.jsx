import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fieldVisitsApi } from '../../services/fieldVisitsApi';
import './ViewFindingsModal.css';

export default function ViewFindingsModal({ visitId, grower, findings, onClose }) {
    const [photos, setPhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    useEffect(() => {
        const loadPhotos = async () => {
            setLoadingPhotos(true);
            try {
                const result = await fieldVisitsApi.getPhotos(visitId);
                const photosWithBlobs = await Promise.all(
                    (result.photos || []).map(async (photo) => {
                        try {
                            // Fetch image as blob with Authorization header
                            const token = sessionStorage.getItem('_auth_token');
                            const response = await fetch(
                                `http://localhost:5089${photo.url}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                }
                            );
                            if (response.ok) {
                                const blob = await response.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                return { ...photo, objectUrl, error: false };
                            } else {
                                console.error(`Failed to load photo: ${photo.url}, status ${response.status}`);
                                return { ...photo, objectUrl: null, error: true };
                            }
                        } catch (err) {
                            console.error(`Error fetching photo blob: ${photo.url}`, err);
                            return { ...photo, objectUrl: null, error: true };
                        }
                    })
                );
                setPhotos(photosWithBlobs);
            } catch (err) {
                console.error('Error loading photos:', err);
                setPhotos([]);
            } finally {
                setLoadingPhotos(false);
            }
        };

        if (visitId) {
            loadPhotos();
        }

        // Cleanup: revoke object URLs when component unmounts
        return () => {
            photos.forEach(photo => {
                if (photo.objectUrl) {
                    URL.revokeObjectURL(photo.objectUrl);
                }
            });
        };
    }, [visitId]);

    return (
        <div className="vf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="vf-modal" role="dialog" aria-modal="true" aria-labelledby="vf-title">
                
                {/* Header */}
                <div className="vf-header">
                    <div>
                        <h2 id="vf-title">Visit Findings</h2>
                        <p>{grower?.name} • {grower?.id}</p>
                    </div>
                    <button className="vf-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="vf-body">
                    {findings ? (
                        <div className="vf-findings">
                            <div className="vf-section">
                                <h3>Observations & Findings</h3>
                                <p>{findings}</p>
                            </div>

                            {/* Photos Section */}
                            {!loadingPhotos && photos.length > 0 && (
                                <div className="vf-section">
                                    <h3>Attached Photos ({photos.filter(p => !p.error).length})</h3>
                                    <div className="photo-gallery">
                                        {photos.map((photo, idx) => (
                                            photo.error ? null : (
                                                <div key={idx} className="photo-item">
                                                    <img 
                                                        src={photo.objectUrl} 
                                                        alt={`Visit photo ${idx + 1}`}
                                                        className="photo-image"
                                                        onError={(e) => {
                                                            console.error(`Failed to display photo: ${photo.fileName}`);
                                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23ddd" width="120" height="120"/%3E%3Ctext x="50%" y="50%" font-size="12" fill="%23666" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                                        }}
                                                        onLoad={() => console.log(`Photo displayed: ${photo.fileName}`)}
                                                    />
                                                    <p className="photo-name">{photo.fileName}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="vf-empty">
                            <p>No findings recorded for this visit</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="vf-footer">
                    <button className="btn-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
