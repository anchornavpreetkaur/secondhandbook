import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  title = 'Failed to Load Data',
  message = 'An error occurred while connecting to the backend server or database.',
  onRetry,
}) {
  return (
    <div className="state-box" id="error-state">
      <div className="state-icon-box error">
        <AlertCircle size={32} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-text">{message}</p>
      {onRetry && (
        <button type="button" className="btn-action" onClick={onRetry}>
          <RefreshCw size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Retry Connection
        </button>
      )}
    </div>
  );
}
