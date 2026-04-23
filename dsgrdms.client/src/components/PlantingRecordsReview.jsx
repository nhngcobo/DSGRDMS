import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import * as plantingApi from '../services/plantingRecordsApi';
import ScheduleVisitModal from './modals/ScheduleVisitModal';
import '../styles/PlantingRecordsReview.css';

export default function PlantingRecordsReview() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [visitScheduled, setVisitScheduled] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    officerNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadRecords();
  }, [user]);

  async function loadRecords() {
    try {
      setLoading(true);
      const data = await plantingApi.getPendingReview();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load pending records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function openReviewModal(record) {
    setSelectedRecord(record);
    setReviewData({
      status: 'approved',
      officerNotes: '',
    });
    setVisitScheduled(false);
    setErrors({});
    setReviewModal(true);
  }

  async function handleReview(e) {
    e.preventDefault();

    if (!reviewData.status) {
      setErrors({ status: 'Status is required' });
      return;
    }

    if (reviewData.status === 'approved' && !visitScheduled) {
      setErrors({ submit: 'You must schedule a field visit before approving this record.' });
      return;
    }

    try {
      setSubmitting(true);
      await plantingApi.reviewRecord(selectedRecord.id, reviewData);
      showSuccess('Planting record review submitted successfully');
      closeModal();
      await loadRecords();
    } catch (error) {
      setErrors({ submit: error.message });
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setReviewModal(false);
    setShowScheduleModal(false);
    setSelectedRecord(null);
    setReviewData({ status: 'approved', officerNotes: '' });
    setVisitScheduled(false);
    setErrors({});
  }

  if (loading) return <div className="loading">Loading pending reviews...</div>;

  return (
    <div className="planting-review-container">
      <div className="review-header">
        <h2>Planting Records Review</h2>
        <p className="subtitle">{records.length} pending records</p>
      </div>

      {records.length === 0 ? (
        <div className="no-records">
          <p>No pending planting records to review.</p>
        </div>
      ) : (
        <div className="records-grid">
          {records.map((record) => (
            <div key={record.id} className="record-item">
              <div className="item-header">
                <div>
                  <h4>{record.plantSpecies}</h4>
                  <p className="grower-id">Grower: {record.growerId}</p>
                </div>
                <span className="date">{new Date(record.datePlanted).toLocaleDateString()}</span>
              </div>

              <div className="item-body">
                <div className="info-row">
                  <span className="info-label">Plants:</span>
                  <span className="info-value">{record.numberOfPlantsPlanted}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Area:</span>
                  <span className="info-value">{record.plantingArea}</span>
                </div>

                {record.issuesEncountered && (
                  <div className="info-row issues">
                    <span className="info-label">Issues:</span>
                    <span className="info-value">{record.issuesEncountered}</span>
                  </div>
                )}

                {record.photoFilenames && record.photoFilenames.length > 0 && (
                  <div className="photos-indicator">
                    📷 {record.photoFilenames.length} photo(s)
                  </div>
                )}
              </div>

              <button
                className="btn btn-review"
                onClick={() => openReviewModal(record)}
              >
                Review Record
              </button>
            </div>
          ))}
        </div>
      )}

      {reviewModal && selectedRecord && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Planting Record</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="record-preview">
                <h4>{selectedRecord.plantSpecies}</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="label">Grower:</span>
                    <span className="value">{selectedRecord.growerId}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Date Planted:</span>
                    <span className="value">
                      {new Date(selectedRecord.datePlanted).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Number of Plants:</span>
                    <span className="value">{selectedRecord.numberOfPlantsPlanted}</span>
                  </div>
                  <div className="preview-item">
                    <span className="label">Area:</span>
                    <span className="value">{selectedRecord.plantingArea}</span>
                  </div>
                  {selectedRecord.issuesEncountered && (
                    <div className="preview-item full-width">
                      <span className="label">Issues Encountered:</span>
                      <span className="value">{selectedRecord.issuesEncountered}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Field Visit Requirement */}
              <div className={`visit-requirement ${visitScheduled ? 'scheduled' : ''}`}>
                <div className="requirement-status">
                  <span className="status-icon">
                    {visitScheduled ? '✓' : '⚠'}
                  </span>
                  <div className="requirement-text">
                    <h4>{visitScheduled ? 'Field Visit Scheduled' : 'Schedule Field Visit Required'}</h4>
                    <p>
                      {visitScheduled
                        ? 'Field visit has been scheduled for inspection.'
                        : 'You must schedule a field visit for inspection before approval.'}
                    </p>
                  </div>
                </div>
                {!visitScheduled && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    Schedule Visit
                  </button>
                )}
              </div>

              <form onSubmit={handleReview} className="review-form">
                <div className="form-group">
                  <label>Review Decision *</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="status"
                        value="approved"
                        checked={reviewData.status === 'approved'}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, status: e.target.value })
                        }
                      />
                      <span className="radio-text approved">Approve</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="status"
                        value="needs_revision"
                        checked={reviewData.status === 'needs_revision'}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, status: e.target.value })
                        }
                      />
                      <span className="radio-text revision">Request Revision</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Feedback to Grower</label>
                  <textarea
                    placeholder="Add your feedback, observations, or instructions..."
                    value={reviewData.officerNotes}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, officerNotes: e.target.value })
                    }
                    rows="4"
                  />
                </div>

                {errors.submit && (
                  <div className="error-box">{errors.submit}</div>
                )}

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && selectedRecord && (
        <ScheduleVisitModal
          applicationId={selectedRecord.id}
          grower={{
            id: selectedRecord.growerId,
            name: selectedRecord.growerId,
          }}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setVisitScheduled(true);
            setShowScheduleModal(false);
            showSuccess('Field visit scheduled successfully');
          }}
        />
      )}
    </div>
  );
}
