import React from 'react';
import { X, Trash2, ExternalLink, Heart, BookOpen, AlertCircle } from 'lucide-react';

const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '—';
  if (currency === 'INR') return `₹${Number(amount).toFixed(2)}`;
  if (currency === 'GBP') return `£${Number(amount).toFixed(2)}`;
  if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
  if (currency === 'EUR') return `€${Number(amount).toFixed(2)}`;
  return `${currency} ${Number(amount).toFixed(2)}`;
};

const getWebsiteClass = (web) => {
  const w = (web || '').toLowerCase();
  if (w.includes('bookchor')) return 'bookchor';
  if (w.includes('thriftbooks')) return 'thriftbooks';
  if (w.includes('abebooks')) return 'abebooks';
  if (w.includes('biblio')) return 'biblio';
  if (w.includes('toscrape')) return 'bookstoscrape';
  if (w.includes('openlibrary')) return 'openlibrary';
  if (w.includes('secondlife')) return 'secondlife';
  return '';
};

export default function WishlistModal({
  isOpen,
  onClose,
  wishlist = [],
  onRemoveItem,
  onClearWishlist,
}) {
  if (!isOpen) return null;

  const totalValue = wishlist.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="wishlist-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-modal-title"
      >
        {/* Modal Header */}
        <div className="wishlist-modal-header">
          <div className="wishlist-modal-title-wrap">
            <div className="wishlist-icon-badge">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <h2 id="wishlist-modal-title" className="wishlist-modal-title">
                My Wishlist
              </h2>
              <span className="wishlist-modal-count">
                {wishlist.length} {wishlist.length === 1 ? 'book' : 'books'} saved
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close wishlist modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wishlist Content */}
        <div className="wishlist-modal-body">
          {wishlist.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="wishlist-empty-icon">
                <Heart size={40} />
              </div>
              <h3>Your wishlist is empty</h3>
              <p>
                Click the heart icon on any book card or comparison row to save it for later price tracking.
              </p>
              <button type="button" className="btn-action" onClick={onClose}>
                Browse Books
              </button>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div className="wishlist-summary-bar">
                <div>
                  <span className="wishlist-total-label">Total Estimated Value: </span>
                  <strong className="wishlist-total-price">
                    {formatCurrency(totalValue, wishlist[0]?.currency || 'INR')}
                  </strong>
                </div>
                <button
                  type="button"
                  className="wishlist-clear-btn"
                  onClick={onClearWishlist}
                  title="Remove all books from wishlist"
                >
                  <Trash2 size={14} /> Clear All
                </button>
              </div>

              {/* Items List */}
              <div className="wishlist-items-list">
                {wishlist.map((item, idx) => {
                  const key = item.wishlistId || item._id || item.sourceUrl || `${item.title}-${idx}`;
                  const websiteClass = getWebsiteClass(item.website);

                  return (
                    <div key={key} className="wishlist-item-card">
                      {/* Book Thumbnail */}
                      <div className="wishlist-item-thumb">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="wishlist-thumb-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="wishlist-thumb-placeholder">
                            <BookOpen size={20} />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="wishlist-item-info">
                        <h4 className="wishlist-item-title" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="wishlist-item-author">{item.author || 'Unknown Author'}</p>

                        <div className="wishlist-item-badges">
                          <span className={`badge badge-website ${websiteClass}`}>
                            {item.website || 'Bookstore'}
                          </span>
                          {item.condition && (
                            <span className="wishlist-condition-tag">
                              {item.condition}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="wishlist-item-actions">
                        <div className="wishlist-item-price">
                          {formatCurrency(item.price, item.currency)}
                        </div>

                        <div className="wishlist-action-buttons">
                          {item.sourceUrl && item.sourceUrl !== '#' && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wishlist-source-link"
                              title="Go to book page"
                            >
                              <span>View</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            type="button"
                            className="wishlist-remove-btn"
                            onClick={() => onRemoveItem(item)}
                            title="Remove from wishlist"
                            aria-label={`Remove ${item.title} from wishlist`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
