import React from 'react';
import { ExternalLink, BookOpen, Heart } from 'lucide-react';

const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '—';
  if (currency === 'INR') return `₹${amount.toFixed(2)}`;
  if (currency === 'GBP') return `£${amount.toFixed(2)}`;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  if (currency === 'EUR') return `€${amount.toFixed(2)}`;
  return `${currency} ${amount.toFixed(2)}`;
};

const getConditionClass = (cond) => {
  const c = (cond || '').toLowerCase();
  if (c.includes('like new')) return 'like-new';
  if (c.includes('very good')) return 'very-good';
  if (c.includes('good')) return 'good';
  if (c.includes('acceptable')) return 'acceptable';
  if (c.includes('fair')) return 'fair';
  return 'good';
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

export default function BookCard({
  book,
  isWishlisted = false,
  onToggleWishlist,
}) {
  const isLowest = book.isLowestPrice === true;
  const websiteClass = getWebsiteClass(book.website);
  const conditionClass = getConditionClass(book.condition);

  const handleOpenSource = (e) => {
    if (book.sourceUrl && book.sourceUrl !== '#') {
      window.open(book.sourceUrl, '_blank', 'noopener,noreferrer');
      if (e) e.preventDefault();
    }
  };

  return (
    <div
      className={`compact-book-card ${isLowest ? 'card-best-deal' : ''}`}
      id={`book-card-${book._id || 'item'}`}
    >
      {/* Top Cover Section */}
      <div className="compact-card-top" onClick={handleOpenSource} title="Click to view original source">
        {/* Store badge */}
        <span className={`badge badge-website ${websiteClass} compact-store-badge`}>
          {book.website}
        </span>

        {/* Lowest Price Tag */}
        {isLowest && <span className="compact-deal-tag">Lowest Price</span>}

        {/* Wishlist Button */}
        <button
          type="button"
          className={`compact-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(book);
          }}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Book Cover Image */}
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="compact-cover-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="compact-placeholder">
            <BookOpen size={36} color="#94a3b8" />
          </div>
        )}
      </div>

      {/* Body Details */}
      <div className="compact-card-body">
        <h3 className="compact-title" title={book.title}>
          {book.title}
        </h3>
        <p className="compact-author">{book.author || 'Unknown Author'}</p>

        <div className="compact-meta-row">
          <span className={`badge badge-condition ${conditionClass}`}>
            {book.condition || 'Good'}
          </span>
          <span className="compact-stock-text">
            &bull; {book.availability || 'In Stock'}
          </span>
        </div>

        {/* Price & Action */}
        <div className="compact-footer">
          <div className={`compact-price ${isLowest ? 'lowest-price' : ''}`}>
            {formatCurrency(book.price, book.currency)}
          </div>

          <button
            type="button"
            onClick={handleOpenSource}
            className="compact-btn-source"
            title={`View on ${book.website}`}
          >
            <span>View Source</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
