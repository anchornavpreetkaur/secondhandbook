import React from 'react';
import { Filter, SlidersHorizontal, LayoutGrid, List, RotateCcw } from 'lucide-react';

export default function FilterBar({
  selectedWebsite,
  onWebsiteChange,
  selectedCondition,
  onConditionChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  availableWebsites = [],
  availableConditions = [],
  onResetFilters,
  hasActiveFilters = false,
  totalResultsCount = 0,
}) {
  return (
    <div className="controls-bar">
      <div className="filters-group">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <Filter size={16} /> Filters:
        </span>

        {/* Website Filter */}
        <select
          id="filter-website-select"
          className="filter-select"
          value={selectedWebsite}
          onChange={(e) => onWebsiteChange(e.target.value)}
          aria-label="Filter by Website"
        >
          <option value="all">All Websites ({availableWebsites.length})</option>
          {availableWebsites.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        {/* Condition Filter */}
        <select
          id="filter-condition-select"
          className="filter-select"
          value={selectedCondition}
          onChange={(e) => onConditionChange(e.target.value)}
          aria-label="Filter by Condition"
        >
          <option value="all">All Conditions</option>
          {availableConditions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Sort Selector */}
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={16} /> Sort:
        </span>
        <select
          id="sort-select"
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort By"
        >
          <option value="price-asc">Lowest Price</option>
          <option value="price-desc">Highest Price</option>
          <option value="website-asc">Website (A-Z)</option>
          <option value="title-asc">Title (A-Z)</option>
          <option value="condition-asc">Condition</option>
        </select>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={onResetFilters}
            title="Reset all filters"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}

        {totalResultsCount !== undefined && totalResultsCount !== null && (
          <span className="results-count-text">
            {totalResultsCount} {totalResultsCount === 1 ? 'listing' : 'listings'}
          </span>
        )}
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          type="button"
          id="view-table-btn"
          className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => onViewModeChange('table')}
          title="Comparison Table View"
        >
          <List size={16} /> Table
        </button>
        <button
          type="button"
          id="view-grid-btn"
          className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          title="Card Grid View"
        >
          <LayoutGrid size={16} /> Grid
        </button>
      </div>
    </div>
  );
}
