
import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ type, className = '' }) => {
  const classes = `skeleton skeleton-${type} ${className}`;

  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton skeleton-rect skeleton-card-image"></div>
        <div className="skeleton-card-body">
          <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <div className="skeleton skeleton-rect" style={{ height: '35px', flex: 1, borderRadius: '6px' }}></div>
            <div className="skeleton skeleton-rect" style={{ height: '35px', flex: 1, borderRadius: '6px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return <div className={classes}></div>;
};

export const ProductSkeletonGrid = ({ count = 4 }) => {
  return (
    <div className="products-grid">
      {Array(count).fill(0).map((_, i) => (
        <Skeleton key={i} type="card" />
      ))}
    </div>
  );
};
