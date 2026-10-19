import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

const SUGGESTED_QUERIES = [
  'Harry Potter',
  'The Great Gatsby',
  '1984',
  'To Kill a Mockingbird',
  'Pride and Prejudice',
  'The Hobbit',
];

export default function SearchBar({ onSearch, currentQuery, onClear }) {
  const [term, setTerm] = useState(currentQuery || '');

  useEffect(() => {
    setTerm(currentQuery || '');
  }, [currentQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term.trim());
    }
  };

  const handleChipClick = (suggestion) => {
    setTerm(suggestion);
    onSearch(suggestion);
  };

  const handleClear = () => {
    setTerm('');
    if (onClear) onClear();
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-box">
        <Search className="search-icon" size={22} />
        <input
          id="book-search-input"
          type="text"
          className="search-input"
          placeholder="Search by book title, author, or ISBN (e.g., Harry Potter)..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {term && (
          <button
            type="button"
            onClick={handleClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', marginRight: '8px' }}
            title="Clear search"
          >
            <X size={18} />
          </button>
        )}
        <button id="book-search-btn" type="submit" className="search-button">
          Search
        </button>
      </form>

      <div className="preset-queries">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} color="var(--brand-primary)" /> Try searching:
        </span>
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            className="preset-pill"
            onClick={() => handleChipClick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
