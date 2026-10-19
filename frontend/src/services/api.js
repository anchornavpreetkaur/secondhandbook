const API_BASE = '/api/books';
const AUTH_BASE = '/api/auth';
const WISHLIST_BASE = '/api/wishlist';

async function readResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `${fallbackMessage}: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function authenticateApi(mode, credentials) {
  const response = await fetch(`${AUTH_BASE}/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return readResponse(response, 'Authentication failed');
}

export async function fetchCurrentUserApi(token) {
  const response = await fetch(`${AUTH_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, 'Could not restore your session');
}

export async function fetchWishlistApi(token) {
  const response = await fetch(WISHLIST_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, 'Could not load your wishlist');
}

export async function addWishlistItemApi(token, book) {
  const response = await fetch(WISHLIST_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ book }),
  });
  return readResponse(response, 'Could not save this book');
}

export async function removeWishlistItemApi(token, itemId) {
  const response = await fetch(`${WISHLIST_BASE}/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, 'Could not remove this book');
}

export async function clearWishlistApi(token) {
  const response = await fetch(WISHLIST_BASE, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, 'Could not clear your wishlist');
}

/**
 * Fetch books with optional pagination, filters, and sorting.
 */
export async function fetchBooks(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });

  const response = await fetch(`${API_BASE}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch books: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Search books by title, author, or ISBN.
 */
export async function searchBooksApi(q, params = {}) {
  const query = new URLSearchParams({ q });
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && key !== 'q') {
      query.append(key, val);
    }
  });

  const response = await fetch(`${API_BASE}/search?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Perform price comparison across multiple website sources for a book title/query.
 */
export async function compareBooksApi(q) {
  const response = await fetch(`${API_BASE}/live-search?q=${encodeURIComponent(q)}`);
  if (!response.ok) {
    throw new Error(`Comparison failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch catalog summary statistics.
 */
export async function fetchSummaryStats() {
  const response = await fetch(`${API_BASE}/stats/summary`);
  if (!response.ok) {
    throw new Error(`Failed to load statistics: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Health check endpoint.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Seed benchmark second-hand books into MongoDB.
 */
export async function seedBenchmarkBooks() {
  const response = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Seeding failed: ${response.statusText}`);
  }
  return response.json();
}
