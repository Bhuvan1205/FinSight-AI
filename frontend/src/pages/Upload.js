import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiFile, FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';
import axios from 'axios';
import './Upload.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploadResult(null);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://127.0.0.1:8000/api/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      setAnalyzing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      setAnalyzing(false);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!uploadResult) return;

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/upload/${uploadResult.upload_id}/confirm`
      );

      alert(`Successfully imported ${response.data.imported_count} transactions!`);
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed');
    }
  };

  const handleCancel = () => {
    setFile(null);
    setUploadResult(null);
    setError('');
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Transaction Data</h1>
        <p>Import your financial transactions from CSV files</p>
      </div>

      {!uploadResult ? (
        <div className="upload-section">
          <div
            className={`dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="file-info">
                <FiFile className="file-icon" />
                <div className="file-details">
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button className="remove-file" onClick={handleCancel}>
                  <FiX />
                </button>
              </div>
            ) : (
              <>
                <FiUpload className="upload-icon" />
                <h3>Drag and drop your CSV file here</h3>
                <p>or</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                  />
                  <span className="btn btn-primary">Choose File</span>
                </label>
                <p className="file-requirements">
                  CSV files only • Max 10MB • Required columns: Date, Description, Amount
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="error-message">
              <FiAlertTriangle /> {error}
            </div>
          )}

          {file && !uploading && (
            <div className="upload-actions">
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpload}>
                Upload & Analyze
              </button>
            </div>
          )}

          {uploading && (
            <div className="analyzing-status">
              <div className="spinner"></div>
              <p>Analyzing your transactions...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="analysis-results">
          <div className="result-header">
            <FiCheckCircle className="success-icon" />
            <h2>Analysis Complete!</h2>
          </div>

          <div className="result-summary">
            <div className="summary-card">
              <h3>Total Transactions</h3>
              <p className="big-number">{uploadResult.total_transactions}</p>
            </div>
            <div className="summary-card">
              <h3>Auto-Categorized</h3>
              <p className="big-number">{uploadResult.analysis.categorization?.length || 0}</p>
            </div>
            <div className="summary-card warning">
              <h3>Anomalies Detected</h3>
              <p className="big-number">{uploadResult.analysis.anomalies?.length || 0}</p>
            </div>
            <div className="summary-card warning">
              <h3>Potential Duplicates</h3>
              <p className="big-number">{uploadResult.analysis.duplicates?.length || 0}</p>
            </div>
          </div>

          {uploadResult.analysis.summary && (
            <div className="financial-summary">
              <h3>Financial Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Total Revenue:</span>
                  <span className="positive">₹{uploadResult.analysis.summary.total_revenue?.toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span>Total Expenses:</span>
                  <span className="negative">₹{Math.abs(uploadResult.analysis.summary.total_expenses || 0).toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span>Net:</span>
                  <span className={uploadResult.analysis.summary.total_amount >= 0 ? 'positive' : 'negative'}>
                    ₹{uploadResult.analysis.summary.total_amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {uploadResult.analysis.anomalies && uploadResult.analysis.anomalies.length > 0 && (
            <div className="anomalies-section">
              <h3><FiAlertTriangle /> Anomalies Detected</h3>
              <div className="anomalies-list">
                {uploadResult.analysis.anomalies.slice(0, 5).map((anomaly, idx) => (
                  <div key={idx} className="anomaly-item">
                    <div className="anomaly-info">
                      <strong>{anomaly.description}</strong>
                      <span className="anomaly-amount">₹{anomaly.amount?.toLocaleString()}</span>
                    </div>
                    <p className="anomaly-reason">{anomaly.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResult.analysis.duplicates && uploadResult.analysis.duplicates.length > 0 && (
            <div className="duplicates-warning">
              <FiAlertTriangle />
              <p>
                {uploadResult.analysis.duplicates.length} potential duplicate(s) found.
                These will be skipped during import.
              </p>
            </div>
          )}

          <div className="result-actions">
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirm}>
              Confirm & Import {uploadResult.total_transactions - (uploadResult.analysis.duplicates?.length || 0)} Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
