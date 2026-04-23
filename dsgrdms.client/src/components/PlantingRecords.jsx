import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as plantingApi from '../services/plantingRecordsApi';
import '../styles/PlantingRecords.css';

export default function PlantingRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    growerId: user?.growerId || '',
    datePlanted: '',
    numberOfPlantsPlanted: '',
    plantSpecies: '',
    plantingArea: '',
    issuesEncountered: '',
    photoFilenames: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [user]);

  async function loadRecords() {
    try {
      setLoading(true);
      if (user?.growerId) {
        const data = await plantingApi.getByGrowerId(user.growerId);
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load planting records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.datePlanted) newErrors.datePlanted = 'Date is required';
    if (!formData.numberOfPlantsPlanted) newErrors.numberOfPlantsPlanted = 'Number of plants is required';
    if (formData.numberOfPlantsPlanted && formData.numberOfPlantsPlanted <= 0) newErrors.numberOfPlantsPlanted = 'Must be greater than 0';
    if (!formData.plantSpecies) newErrors.plantSpecies = 'Plant species is required';
    if (!formData.plantingArea) newErrors.plantingArea = 'Planting area is required';

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload images if any exist
      let uploadedFilenames = [];
      const fileObjects = formData.photoFilenames?.filter(f => f.file) || [];
      
      if (fileObjects.length > 0) {
        const files = fileObjects.map(f => f.file);
        uploadedFilenames = await plantingApi.uploadImages(formData.growerId, files);
      }
      
      // Combine with existing filenames (if editing)
      const existingFilenames = formData.photoFilenames?.filter(f => typeof f === 'string') || [];
      const allFilenames = [...existingFilenames, ...uploadedFilenames];

      const payload = {
        ...formData,
        numberOfPlantsPlanted: parseInt(formData.numberOfPlantsPlanted),
        datePlanted: formData.datePlanted,
        photoFilenames: allFilenames,
      };

      if (selectedRecord) {
        await plantingApi.updateRecord(selectedRecord.id, payload);
      } else {
        await plantingApi.createRecord(payload);
      }

      resetForm();
      await loadRecords();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      growerId: user?.growerId || '',
      datePlanted: '',
      numberOfPlantsPlanted: '',
      plantSpecies: '',
      plantingArea: '',
      issuesEncountered: '',
      photoFilenames: [],
    });
    setErrors({});
    setSelectedRecord(null);
    setShowForm(false);
  }

  function handleEdit(record) {
    setSelectedRecord(record);
    setFormData({
      growerId: record.growerId,
      datePlanted: record.datePlanted.split('T')[0],
      numberOfPlantsPlanted: record.numberOfPlantsPlanted,
      plantSpecies: record.plantSpecies,
      plantingArea: record.plantingArea,
      issuesEncountered: record.issuesEncountered || '',
      photoFilenames: record.photoFilenames || [],
    });
    setShowForm(true);
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    const newFilenames = [...(formData.photoFilenames || [])];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newFilenames.push({
          name: file.name,
          blob: event.target.result,
          file: file
        });
      };
      reader.readAsDataURL(file);
    });
    
    setFormData({ ...formData, photoFilenames: newFilenames });
  }

  function removeImage(index) {
    const updated = formData.photoFilenames.filter((_, i) => i !== index);
    setFormData({ ...formData, photoFilenames: updated });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'approved':
        return '#166534';
      case 'pending_review':
        return '#b45309';
      case 'needs_revision':
        return '#991b1b';
      default:
        return '#666';
    }
  }

  if (loading) return <div className="loading">Loading planting records...</div>;

  return (
    <div className="planting-records-container">
      <div className="records-header">
        <h2>Planting Records</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Record Planting
          </button>
        )}
      </div>

      {showForm && (
        <div className="planting-form-container">
          <h3>{selectedRecord ? 'Edit Planting Record' : 'New Planting Record'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Date Planted *</label>
                <input
                  type="date"
                  value={formData.datePlanted}
                  onChange={(e) => setFormData({ ...formData, datePlanted: e.target.value })}
                  className={errors.datePlanted ? 'error' : ''}
                />
                {errors.datePlanted && <span className="error-msg">{errors.datePlanted}</span>}
              </div>

              <div className="form-group">
                <label>Number of Plants *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfPlantsPlanted}
                  onChange={(e) => setFormData({ ...formData, numberOfPlantsPlanted: e.target.value })}
                  className={errors.numberOfPlantsPlanted ? 'error' : ''}
                />
                {errors.numberOfPlantsPlanted && <span className="error-msg">{errors.numberOfPlantsPlanted}</span>}
              </div>

              <div className="form-group">
                <label>Plant Species *</label>
                <input
                  type="text"
                  placeholder="e.g., Eucalyptus, Pine"
                  value={formData.plantSpecies}
                  onChange={(e) => setFormData({ ...formData, plantSpecies: e.target.value })}
                  className={errors.plantSpecies ? 'error' : ''}
                />
                {errors.plantSpecies && <span className="error-msg">{errors.plantSpecies}</span>}
              </div>

              <div className="form-group">
                <label>Planting Area *</label>
                <input
                  type="text"
                  placeholder="e.g., North Field, Block A"
                  value={formData.plantingArea}
                  onChange={(e) => setFormData({ ...formData, plantingArea: e.target.value })}
                  className={errors.plantingArea ? 'error' : ''}
                />
                {errors.plantingArea && <span className="error-msg">{errors.plantingArea}</span>}
              </div>

              <div className="form-group full-width">
                <label>Issues Encountered</label>
                <textarea
                  placeholder="Any problems or observations..."
                  value={formData.issuesEncountered}
                  onChange={(e) => setFormData({ ...formData, issuesEncountered: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-group full-width">
                <label>Photos / Evidence</label>
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="image-input"
                  />
                  <label htmlFor="images" className="image-upload-label">
                    <p>Click to upload photos or drag and drop</p>
                    <small>PNG, JPG, GIF up to 10MB each</small>
                  </label>
                </div>
                {formData.photoFilenames && formData.photoFilenames.length > 0 && (
                  <div className="image-preview-grid">
                    {formData.photoFilenames.map((file, idx) => (
                      <div key={idx} className="image-preview-item">
                        <div className="preview-image">
                          {file?.blob ? (
                            <img src={file.blob} alt="Preview" />
                          ) : typeof file === 'string' ? (
                            <div className="file-icon">📄</div>
                          ) : (
                            <div className="file-icon">📄</div>
                          )}
                        </div>
                        <p className="file-name">{typeof file === 'string' ? file.split('/').pop() : file.name}</p>
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {errors.submit && <div className="error-box">{errors.submit}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : selectedRecord ? 'Update Record' : 'Save Record'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="records-list">
        {records.length === 0 ? (
          <p className="empty-state">No planting records yet. Start by recording your first planting operation.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="record-card">
              <div className="record-header">
                <div>
                  <h4>{record.plantSpecies}</h4>
                  <p className="date">{new Date(record.datePlanted).toLocaleDateString()}</p>
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(record.status) }}
                >
                  {record.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>

              <div className="record-details">
                <div className="detail-row">
                  <span className="label">Plants Planted:</span>
                  <span className="value">{record.numberOfPlantsPlanted}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Area:</span>
                  <span className="value">{record.plantingArea}</span>
                </div>

                {record.issuesEncountered && (
                  <div className="detail-row">
                    <span className="label">Issues:</span>
                    <span className="value">{record.issuesEncountered}</span>
                  </div>
                )}

                {record.officerNotes && (
                  <div className="detail-row officer-feedback">
                    <span className="label">Officer Feedback:</span>
                    <span className="value">{record.officerNotes}</span>
                  </div>
                )}

                {record.photoFilenames && record.photoFilenames.length > 0 && (
                  <div className="photos-section">
                    <p className="label">Photos: {record.photoFilenames.length} attached</p>
                  </div>
                )}
              </div>

              {record.status === 'pending_review' && (
                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(record)}>
                  Edit Record
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
