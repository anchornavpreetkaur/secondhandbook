import React, { useState, useEffect } from 'react';
import { BookMarked, Sun, Moon, Heart, LogIn, LogOut } from 'lucide-react';
import Home from './pages/Home';
import WishlistModal from './components/WishlistModal';
import AuthModal from './components/AuthModal';
import {
  addWishlistItemApi,
  authenticateApi,
  clearWishlistApi,
  fetchCurrentUserApi,
  fetchWishlistApi,
  removeWishlistItemApi,
} from './services/api';

const TOKEN_STORAGE_KEY = 'book_auth_token';

const toWishlistBook = ({ id, book }) => ({ ...book, wishlistId: id });

const sameBook = (a, b) => (
  (a._id && b._id && String(a._id) === String(b._id))
  || (a.sourceUrl && b.sourceUrl && a.sourceUrl === b.sourceUrl)
  || (a.title && b.title
    && a.title.trim().toLowerCase() === b.title.trim().toLowerCase()
    && a.website === b.website)
);

export default function App() {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback
    }
    return 'light';
  });

  const [wishlist, setWishlist] = useState([]);
  const [pendingWishlistBook, setPendingWishlistBook] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [user, setUser] = useState(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [appError, setAppError] = useState('');

  useEffect(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('app_theme', theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  }, [theme]);

  // Restore the authenticated account and its server-side wishlist.
  useEffect(() => {
    let active = true;
    if (!token) return () => { active = false; };

    Promise.all([fetchCurrentUserApi(token), fetchWishlistApi(token)])
      .then(([account, savedWishlist]) => {
        if (!active) return;
        setUser(account.user);
        setWishlist(savedWishlist.items.map(toWishlistBook));
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken('');
          setUser(null);
          setWishlist([]);
        } else {
          setAppError(error.message);
        }
      });

    return () => { active = false; };
  }, [token]);

  const handleAuthenticate = async (mode, credentials) => {
    const response = await authenticateApi(mode, credentials);
    if (mode === 'register') {
      return response;
    }

    const savedWishlist = await fetchWishlistApi(response.token);
    let wishlistBooks = savedWishlist.items.map(toWishlistBook);
    let wishlistError = '';
    if (pendingWishlistBook) {
      try {
        if (!wishlistBooks.some((book) => sameBook(book, pendingWishlistBook))) {
          const result = await addWishlistItemApi(response.token, pendingWishlistBook);
          wishlistBooks = [toWishlistBook(result.item), ...wishlistBooks];
        }
      } catch (error) {
        wishlistError = error.message;
      }
      setPendingWishlistBook(null);
    }

    sessionStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    setWishlist(wishlistBooks);
    setAppError(wishlistError);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setUser(null);
    setWishlist([]);
    setIsWishlistOpen(false);
    setAppError('');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleWishlist = async (book) => {
    if (!book) return;
    if (!user || !token) {
      setPendingWishlistBook(book);
      setIsAuthOpen(true);
      return;
    }

    try {
      const existing = wishlist.find((item) => sameBook(item, book));
      if (existing) {
        await removeWishlistItemApi(token, existing.wishlistId);
        setWishlist((current) => current.filter((item) => item.wishlistId !== existing.wishlistId));
      } else {
        const result = await addWishlistItemApi(token, book);
        const savedBook = toWishlistBook(result.item);
        setWishlist((current) => current.some((item) => sameBook(item, savedBook))
          ? current
          : [savedBook, ...current]);
      }
      setAppError('');
    } catch (error) {
      setAppError(error.message);
    }
  };

  const handleRemoveFromWishlist = async (item) => {
    try {
      await removeWishlistItemApi(token, item.wishlistId);
      setWishlist((current) => current.filter((book) => book.wishlistId !== item.wishlistId));
      setAppError('');
    } catch (error) {
      setAppError(error.message);
    }
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlistApi(token);
      setWishlist([]);
      setAppError('');
    } catch (error) {
      setAppError(error.message);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon-box">
              <BookMarked size={24} />
            </div>
            <div>
              <div className="brand-title">SecondHand Books</div>
              <div className="brand-subtitle">Web Scraping & Price Comparison</div>
            </div>
          </div>

          {/* Account, wishlist, and theme actions */}
          <div className="header-actions">
            {user && <span className="account-name">{user.name}</span>}
            <button
              type="button"
              className="header-btn"
              onClick={() => user ? handleLogout() : setIsAuthOpen(true)}
              title={user ? 'Log out' : 'Log in or create an account'}
            >
              {user ? <LogOut size={18} /> : <LogIn size={18} />}
              <span className="btn-label">{user ? 'Log out' : 'Log in'}</span>
            </button>
            {/* Wishlist Button */}
            <button
              type="button"
              id="header-wishlist-btn"
              className="header-btn header-wishlist-btn"
              onClick={() => user ? setIsWishlistOpen(true) : setIsAuthOpen(true)}
              title="View your saved wishlist books"
              aria-label="Wishlist"
            >
              <Heart
                size={18}
                className={wishlist.length > 0 ? 'heart-filled' : ''}
                fill={wishlist.length > 0 ? 'currentColor' : 'none'}
              />
              <span className="btn-label">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="header-badge-count" id="wishlist-counter-badge">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Theme Toggle Button (Dark / Light) */}
            <button
              type="button"
              id="header-theme-toggle-btn"
              className="header-btn header-theme-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={18} />
                  <span className="btn-label">Dark</span>
                </>
              ) : (
                <>
                  <Sun size={18} />
                  <span className="btn-label">Light</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content">
        {appError && <p className="app-error" role="alert">{appError}</p>}
        <Home
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />
      </main>

      {/* Wishlist Drawer / Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveItem={handleRemoveFromWishlist}
        onClearWishlist={handleClearWishlist}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingWishlistBook(null);
        }}
        onAuthenticate={handleAuthenticate}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <p style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Second-Hand Book Store &bull; Price Comparison Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
