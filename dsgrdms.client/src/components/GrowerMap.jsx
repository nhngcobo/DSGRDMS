import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import './GrowerMap.css';

export default function GrowerMap({ lat, lng, growerName }) {
    const [loaded, setLoaded] = useState(false);
    const embedSrc  = `https://maps.google.com/maps?q=${lat},${lng}&z=14&t=k&output=embed`;
    const mapsUrl   = `https://www.google.com/maps?q=${lat},${lng}`;

    return (
        <div className="gd-card gd-map-card">
            <div className="gd-map-header">
                <span className="gd-card-title">📍 Farm Location</span>
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="gd-open-maps-btn"
                    title="Open in Google Maps"
                >
                    <ExternalLink size={13} />
                    Open in Google Maps
                </a>
            </div>
            <div className="gd-map-container">
                {!loaded && (
                    <div className="gd-map-skeleton">
                        <div className="gd-map-spinner" />
                        <span className="gd-map-loading-text">Loading map…</span>
                    </div>
                )}
                <iframe
                    title={`Map – ${growerName}`}
                    src={embedSrc}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={() => setLoaded(true)}
                    style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                />
            </div>
            <p className="gd-map-coords">
                {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
        </div>
    );
}
