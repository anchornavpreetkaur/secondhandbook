import React from 'react';
import { ExternalLink, Tag, BookOpen, Heart } from 'lucide-react';

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

export default function ComparisonTable({
  listings = [],
  isItemWishlisted = () => false,
  onToggleWishlist,
}) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="table-container">
      <table className="comparison-table" id="comparison-results-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>Save</th>
            <th>Book Details</th>
            <th>ISBN / Edition</th>
            <th>Website</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Availability</th>
            <th style={{ textAlign: 'right' }}>Source Link</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((item, idx) => {
            const isLowest = item.isLowestPrice === true;
            const websiteClass = getWebsiteClass(item.website);
            const conditionClass = getConditionClass(item.condition);
            const isWishlisted = isItemWishlisted(item);

            return (
              <tr
                key={item._id || item.sourceUrl || idx}
                className={isLowest ? 'best-deal-row' : ''}
              >
                {/* Wishlist Heart Action */}
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className={`table-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => onToggleWishlist && onToggleWishlist(item)}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </td>

                {/* Title & Author */}
                <td>
                  <div className="book-title-cell">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="book-thumb"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="book-thumb"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <BookOpen size={20} color="var(--text-subtle)" />
                      </div>
                    )}
                    <div>
                      <div className="book-meta-title">{item.title}</div>
                      <div className="book-meta-author">{item.author || 'Unknown Author'}</div>
                    </div>
                  </div>
                </td>

                {/* ISBN & Edition */}
                <td>
                  <div className="book-meta-isbn">{item.isbn ? `ISBN: ${item.isbn}` : 'ISBN: —'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.edition || 'Standard Edition'}
                  </div>
                </td>

                {/* Source Website */}
                <td>
                  <span className={`badge badge-website ${websiteClass}`}>
                    {item.website}
                  </span>
                </td>

                {/* Condition */}
                <td>
                  <span className={`badge badge-condition ${conditionClass}`}>
                    {item.condition || 'Good'}
                  </span>
                </td>

                {/* Price & Currency */}
                <td>
                  <div className={`price-display ${isLowest ? 'lowest' : ''}`}>
                    {formatCurrency(item.price, item.currency)}
                    {isLowest && <span className="deal-tag">Lowest</span>}
                  </div>
                  {item.savingsVsMaxPercent > 0 && !isLowest && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {item.savingsVsMaxPercent}% vs max
                    </div>
                  )}
                </td>

                {/* Availability */}
                <td>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color:
                        item.availability === 'In Stock'
                          ? 'var(--accent-emerald)'
                          : 'var(--accent-amber)',
                    }}
                  >
                    {item.availability || 'In Stock'}
                  </span>
                </td>

                {/* View Source Button */}
                <td style={{ textAlign: 'right' }}>
                  <a
                    href={item.sourceUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-source"
                    title={`Open original listing on ${item.website}: ${item.sourceUrl}`}
                    onClick={(e) => {
                      if (item.sourceUrl && item.sourceUrl !== '#') {
                        window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
                        e.preventDefault();
                      }
                    }}
                  >
                    View Source <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
