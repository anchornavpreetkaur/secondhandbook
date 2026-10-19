import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, AlertCircle, Sparkles, Filter, RotateCcw } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import ComparisonTable from '../components/ComparisonTable';
import BookCard from '../components/BookCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { fetchBooks, searchBooksApi, compareBooksApi, seedBenchmarkBooks } from '../services/api';

const POPULAR_BOOK_SEARCHES = ['Harry Potter', 'The Great Gatsby', '1984', 'The Hobbit'];

// Comprehensive benchmark second-hand books data for instant comparison & fallback
const DEFAULT_BENCHMARK_LISTINGS = [
  // --- Harry Potter multi-source comparison ---
  {
    _id: "hp-bc",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Scholastic Paperback",
    condition: "Acceptable",
    price: 220.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780590353427/harry-potter-sorcerers-stone",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },
  {
    _id: "hp-tb",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Bloomsbury Paperback",
    condition: "Good",
    price: 280.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/harry-potter-and-the-sorcerers-stone_j-k-rowling/245719/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },
  {
    _id: "hp-1",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Scholastic 1st Paperback",
    condition: "Good",
    price: 350.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },
  {
    _id: "hp-ab",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Arthur A. Levine Hardcover",
    condition: "Very Good",
    price: 390.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780590353427",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },
  {
    _id: "hp-2",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Bloomsbury Special Edition",
    condition: "Very Good",
    price: 420.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL82563W/Harry_Potter_and_the_Philosopher_s_Stone",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },
  {
    _id: "hp-3",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Hardcover Collector's Edition",
    condition: "Like New",
    price: 500.0,
    currency: "INR",
    availability: "Limited Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=Harry+Potter",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
  },

  // --- The Great Gatsby comparison ---
  {
    _id: "gg-bc",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "Pocket Books",
    condition: "Good",
    price: 149.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780743273565/the-great-gatsby",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },
  {
    _id: "gg-2",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "Penguin Modern Classics",
    condition: "Acceptable",
    price: 180.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL468516W/The_Great_Gatsby",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },
  {
    _id: "gg-tb",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "Scribner Trade Edition",
    condition: "Good",
    price: 195.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/the-great-gatsby_f-scott-fitzgerald/245856/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },
  {
    _id: "gg-1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "Scribner Trade Paperback",
    condition: "Good",
    price: 220.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },
  {
    _id: "gg-ab",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "F. Scott Fitzgerald Classic",
    condition: "Very Good",
    price: 275.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780743273565",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },
  {
    _id: "gg-3",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    edition: "Centennial Hardcover",
    condition: "Like New",
    price: 310.0,
    currency: "INR",
    availability: "In Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=The+Great+Gatsby",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
  },

  // --- 1984 comparison ---
  {
    _id: "1984-2",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Penguin Essentials",
    condition: "Fair",
    price: 150.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL1168007W/1984",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },
  {
    _id: "1984-bc",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Fingerprint Publishing",
    condition: "Good",
    price: 165.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780451524935/1984",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },
  {
    _id: "1984-1",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Signet Classic",
    condition: "Good",
    price: 190.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },
  {
    _id: "1984-tb",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Signet 50th Anniversary",
    condition: "Very Good",
    price: 210.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/1984_george-orwell/245842/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },
  {
    _id: "1984-ab",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Plume Trade Paperback",
    condition: "Very Good",
    price: 250.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780451524935",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },
  {
    _id: "1984-3",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    edition: "Harvill Secker Hardback",
    condition: "Very Good",
    price: 280.0,
    currency: "INR",
    availability: "In Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=1984+George+Orwell",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"
  },

  // --- To Kill a Mockingbird ---
  {
    _id: "tkm-bc",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "Vintage Paperback",
    condition: "Good",
    price: 199.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780060935467/to-kill-a-mockingbird",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },
  {
    _id: "tkm-tb",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "Warner Books Paperback",
    condition: "Acceptable",
    price: 240.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/to-kill-a-mockingbird_harper-lee/245851/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },
  {
    _id: "tkm-1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "Harper Perennial",
    condition: "Good",
    price: 290.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },
  {
    _id: "tkm-ol",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "HarperCollins Paperback",
    condition: "Very Good",
    price: 310.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL5976544W/To_Kill_a_Mockingbird",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },
  {
    _id: "tkm-ab",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "Harper Classic Hardcover",
    condition: "Very Good",
    price: 340.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780060935467",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },
  {
    _id: "tkm-2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780060935467",
    edition: "50th Anniversary Edition",
    condition: "Like New",
    price: 380.0,
    currency: "INR",
    availability: "In Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=To+Kill+a+Mockingbird",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-L.jpg"
  },

  // --- Pride and Prejudice ---
  {
    _id: "pap-bc",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Rupa Classics Paperback",
    condition: "Fair",
    price: 175.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780141439518/pride-and-prejudice",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },
  {
    _id: "pap-1",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Penguin Classics",
    condition: "Good",
    price: 210.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL15848529W/Pride_and_Prejudice",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },
  {
    _id: "pap-tb",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Oxford World's Classics",
    condition: "Good",
    price: 230.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/pride-and-prejudice_jane-austen/245876/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },
  {
    _id: "pap-bts",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Dover Thrift Edition",
    condition: "Very Good",
    price: 245.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },
  {
    _id: "pap-2",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Vintage Classics",
    condition: "Very Good",
    price: 260.0,
    currency: "INR",
    availability: "In Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=Pride+and+Prejudice",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },
  {
    _id: "pap-ab",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    edition: "Collector's Library Hardcover",
    condition: "Like New",
    price: 295.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780141439518",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
  },

  // --- The Hobbit ---
  {
    _id: "hob-bc",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "HarperCollins Paperback",
    condition: "Acceptable",
    price: 225.0,
    currency: "INR",
    availability: "In Stock",
    website: "BookChor",
    sourceUrl: "https://www.bookchor.com/book/9780547928227/the-hobbit",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  },
  {
    _id: "hob-3",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "Mariner Illustrated",
    condition: "Acceptable",
    price: 260.0,
    currency: "INR",
    availability: "In Stock",
    website: "SecondLife Books",
    sourceUrl: "https://archive.org/search?query=The+Hobbit+Tolkien",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  },
  {
    _id: "hob-tb",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "Ballantine Books Edition",
    condition: "Good",
    price: 280.0,
    currency: "INR",
    availability: "In Stock",
    website: "ThriftBooks",
    sourceUrl: "https://www.thriftbooks.com/w/the-hobbit_j-r-r-tolkien/245890/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  },
  {
    _id: "hob-2",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "HarperCollins Paperback",
    condition: "Good",
    price: 310.0,
    currency: "INR",
    availability: "In Stock",
    website: "OpenLibrary Market",
    sourceUrl: "https://openlibrary.org/works/OL262412W/The_Hobbit",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  },
  {
    _id: "hob-ab",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "75th Anniversary Edition",
    condition: "Very Good",
    price: 360.0,
    currency: "INR",
    availability: "In Stock",
    website: "AbeBooks",
    sourceUrl: "https://www.abebooks.com/servlet/SearchResults?isbn=9780547928227",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  },
  {
    _id: "hob-1",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    edition: "Deluxe Pocket Edition",
    condition: "Like New",
    price: 390.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
  }
];

export default function Home({ wishlist = [], onToggleWishlist }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  const [viewMode, setViewMode] = useState('grid'); // Default to beautiful Card view

  // Load initial books so users can browse and filter immediately on page load
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await fetchBooks({ limit: 60, currency: 'EUR', website: 'Suomalainen.com' });
        if (res && res.success && res.data) setListings(res.data);
      } catch (err) {
        console.warn('Backend fetch failed:', err);
      }
    };

    loadInitial();
  }, []);

  const isItemWishlisted = (item) => {
    if (!item) return false;
    return wishlist.some(
      (b) =>
        (b._id && item._id && b._id === item._id) ||
        (b.sourceUrl && item.sourceUrl && b.sourceUrl === item.sourceUrl) ||
        (b.title && item.title && b.title.trim().toLowerCase() === item.title.trim().toLowerCase() && b.website === item.website)
    );
  };

  const handleSearch = async (query) => {
    if (!query || query.trim() === '') {
      handleClearSearch();
      return;
    }

    const cleanQ = query.trim();
    setSearchQuery(cleanQ);
    setHasSearched(true);
    setLoading(true);
    setError(null);

    // Reset filters on new search to avoid hiding relevant search results
    setSelectedWebsite('all');
    setSelectedCondition('all');

    try {
      // 1. Attempt API comparison query
      const compRes = await compareBooksApi(cleanQ);
      if (compRes && compRes.success && compRes.listings) {
        setComparisonData(compRes);
        setListings(compRes.listings);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Live Finnish book search failed:', err);
    }

    setComparisonData(null);
    setError('Finnish book listings could not be loaded. Please try again.');
    setListings([]);
    setLoading(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setComparisonData(null);
    setSelectedWebsite('all');
    setSelectedCondition('all');
    setListings([]);
  };

  const handleResetFilters = () => {
    setSelectedWebsite('all');
    setSelectedCondition('all');
    setSortBy('price-asc');
  };

  // Derive unique websites from current listings
  const availableWebsites = useMemo(() => {
    const set = new Set();
    listings.forEach((item) => {
      if (item.website) set.add(item.website.trim());
    });
    return Array.from(set);
  }, [listings]);

  // Derive unique conditions from current listings
  const availableConditions = useMemo(() => {
    const set = new Set();
    listings.forEach((item) => {
      if (item.condition) set.add(item.condition.trim());
    });
    const list = Array.from(set);
    return list.length > 0 ? list : ['Like New', 'Very Good', 'Good', 'Acceptable', 'Fair'];
  }, [listings]);

  const hasActiveFilters = selectedWebsite !== 'all' || selectedCondition !== 'all' || sortBy !== 'price-asc';

  // Filter and Sort listings
  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];

    // Filter by website (case-insensitive & trimmed)
    if (selectedWebsite !== 'all') {
      const targetWeb = selectedWebsite.toLowerCase().trim();
      result = result.filter(
        (item) => item.website && item.website.toLowerCase().trim() === targetWeb
      );
    }

    // Filter by condition (case-insensitive & trimmed)
    if (selectedCondition !== 'all') {
      const targetCond = selectedCondition.toLowerCase().trim();
      result = result.filter(
        (item) => item.condition && item.condition.toLowerCase().trim() === targetCond
      );
    }

    // Sorting
    result.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'website-asc') return (a.website || '').localeCompare(b.website || '');
      if (sortBy === 'condition-asc') return (a.condition || '').localeCompare(b.condition || '');
      return 0;
    });

    return result;
  }, [listings, selectedWebsite, selectedCondition, sortBy]);

  return (
    <div className="home-page">
      {/* Hero Header */}
      <section className="hero-section">
        <h1 className="hero-title">Second-Hand Book Price Comparison</h1>
        <p className="hero-description">
          Search and compare real-time second-hand book prices, conditions, and editions aggregated across multiple bookstores.
        </p>
      </section>

      {/* Search Input Bar */}
      <SearchBar
        onSearch={handleSearch}
        currentQuery={searchQuery}
        onClear={handleClearSearch}
      />

      {/* Comparison Metrics Banner (When a search is active and listings found) */}
      {comparisonData && comparisonData.totalOffers > 0 && (
        <section className="comparison-banner" id="comparison-summary-banner">
          <div className="metric-item">
            <span className="metric-label">Search Query</span>
            <span className="metric-value">"{comparisonData.query}"</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Listings Found</span>
            <span className="metric-value">{comparisonData.totalOffers} Offers</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">
              {comparisonData.lowestPrice !== null ? 'Best Price (Same Book)' : 'Comparable Titles'}
            </span>
            <span className="metric-value metric-highlight">
              {comparisonData.lowestPrice !== null
                ? `€${comparisonData.lowestPrice.toFixed(2)}`
                : comparisonData.comparableBookCount}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Lowest Price Store (Same Book)</span>
            <span className="metric-value" style={{ fontSize: '1.25rem' }}>
              {comparisonData.cheapestSource || '—'}
            </span>
          </div>
        </section>
      )}

      {/* Controls: Filter, Sort, View Toggle */}
      {!loading && !error && listings.length > 0 && (
        <FilterBar
          selectedWebsite={selectedWebsite}
          onWebsiteChange={setSelectedWebsite}
          selectedCondition={selectedCondition}
          onConditionChange={setSelectedCondition}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableWebsites={availableWebsites}
          availableConditions={availableConditions}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          totalResultsCount={filteredAndSortedListings.length}
        />
      )}

      {/* Main Content Area */}
      {loading ? (
        <Loading message={`Searching across bookstores for "${searchQuery}"...`} />
      ) : error ? (
        <ErrorMessage
          title="Service Unavailable"
          message={error}
          onRetry={() => handleSearch(searchQuery)}
        />
      ) : listings.length === 0 && !hasSearched ? null : listings.length === 0 ? (
        <div className="state-box" id="no-results-state">
          <div className="state-icon-box info">
            <BookOpen size={30} />
          </div>
          <h3 className="state-title">No books found</h3>
          <p className="state-text">
            No second-hand book listings matched "{searchQuery}". Try searching for popular titles like "Harry Potter", "The Great Gatsby", or "1984".
          </p>
        </div>
      ) : filteredAndSortedListings.length === 0 ? (
        <div className="state-box" id="no-filter-match-state">
          <div className="state-icon-box info">
            <Filter size={30} />
          </div>
          <h3 className="state-title">No books match selected filters</h3>
          <p className="state-text">
            No listings matched your active filter criteria (
            {selectedWebsite !== 'all' && `Website: ${selectedWebsite}`}
            {selectedWebsite !== 'all' && selectedCondition !== 'all' && ', '}
            {selectedCondition !== 'all' && `Condition: ${selectedCondition}`}
            ).
          </p>
          <button type="button" className="btn-action" onClick={handleResetFilters}>
            <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <ComparisonTable
          listings={filteredAndSortedListings}
          isItemWishlisted={isItemWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      ) : (
        <div className="cards-grid" id="cards-results-grid">
          {filteredAndSortedListings.map((book, idx) => (
            <BookCard
              key={book._id || book.sourceUrl || idx}
              book={book}
              isWishlisted={isItemWishlisted(book)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}

      {!hasSearched && !loading && !error && (
        <section className="popular-searches" aria-labelledby="popular-searches-title">
          <h2 id="popular-searches-title">
            <Sparkles size={17} aria-hidden="true" /> Popular in Finland
          </h2>
          <div className="popular-searches-list">
            {POPULAR_BOOK_SEARCHES.map((title) => (
              <button
                key={title}
                type="button"
                className="preset-pill"
                onClick={() => handleSearch(title)}
              >
                {title}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
