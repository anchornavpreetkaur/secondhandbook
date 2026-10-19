import React from 'react';

export default function Loading({ message = 'Searching second-hand listings across sources...' }) {
  return (
    <div className="loading-box" id="loading-state">
      <div className="spinner"></div>
      <p style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text-main)' }}>{message}</p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
        Normalizing condition, pricing, and availability records
      </p>
    </div>
  );
}
