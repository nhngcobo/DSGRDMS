import { ExternalLink } from 'lucide-react';
import './GrowerMap.css';

export default function GrowerMap({ lat, lng, growerName }) {
    const embedSrc  = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
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
                <iframe
                    title={`Map – ${growerName}`}
                    src={embedSrc}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
            <p className="gd-map-coords">
                {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
        </div>
    );
}
