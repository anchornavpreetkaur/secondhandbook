const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { execFile, execFileSync } = require('child_process');
const { promisify } = require('util');
const Book = require('../models/Book');
const execFileAsync = promisify(execFile);

const resolvePythonExecutable = () => {
  const configuredExecutable = process.env.PYTHON_EXECUTABLE;
  if (configuredExecutable && configuredExecutable.trim()) {
    return configuredExecutable.trim().split(/\s+/)[0];
  }

  if (process.platform === 'win32') {
    const userProfile = process.env.USERPROFILE || process.env.HOMEDRIVE && process.env.HOMEPATH
      ? `${process.env.HOMEDRIVE}${process.env.HOMEPATH}`
      : '';
    const winCandidates = [
      'C:\\Python312\\python.exe',
      'C:\\Python311\\python.exe',
      'C:\\Python310\\python.exe',
      'C:\\Python39\\python.exe',
      'C:\\Python38\\python.exe',
      `${userProfile}\\AppData\\Local\\Programs\\Python\\Python312\\python.exe`,
      `${userProfile}\\AppData\\Local\\Programs\\Python\\Python311\\python.exe`,
      `${userProfile}\\AppData\\Local\\Programs\\Python\\Python310\\python.exe`,
      `${userProfile}\\AppData\\Local\\Programs\\Python\\Python39\\python.exe`,
    ].filter((candidate) => candidate && !candidate.includes('Microsoft\\WindowsApps'));

    for (const candidate of winCandidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  const candidates = process.platform === 'win32'
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];

  for (const candidate of candidates) {
    try {
      const command = process.platform === 'win32' ? 'where' : 'which';
      execFileSync(command, [candidate], { stdio: 'ignore' });
      return candidate;
    } catch (error) {
      // Try the next candidate.
    }
  }

  return process.platform === 'win32' ? 'py' : 'python3';
};

exports.resolvePythonExecutable = resolvePythonExecutable;

const TITLE_IGNORED_WORDS = new Set([
  'a', 'an', 'and', 'book', 'hardback', 'hardcover', 'the', 'paperback', 'softcover',
  'kirja', 'pokkari', 'pokkarikirja', 'kovakantinen', 'pehmeakantinen', 'nidottu', 'sidottu',
]);

const getComparisonKey = (book) => {
  const title = String(book.title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => !TITLE_IGNORED_WORDS.has(word))
    .sort()
    .join(' ');
  return `title:${title}`;
};

exports.searchFinnishBooks = async (req, res) => {
  const cleanQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!cleanQuery) {
    return res.status(400).json({ success: false, message: 'Query parameter "q" is required', data: [] });
  }

  try {
    const pythonExecutable = resolvePythonExecutable();
    const scraperScript = path.resolve(__dirname, '../../scraper/finland_search.py');
    const { stdout } = await execFileAsync(
      pythonExecutable,
      [scraperScript, cleanQuery],
      { timeout: 20000, maxBuffer: 1024 * 1024, windowsHide: true }
    );
    const listings = JSON.parse(stdout);
    const groups = new Map();
    listings.forEach((book) => {
      const comparisonKey = getComparisonKey(book);
      if (!groups.has(comparisonKey)) groups.set(comparisonKey, []);
      groups.get(comparisonKey).push(book);
    });

    const comparisons = [...groups.entries()]
      .map(([comparisonKey, books]) => {
        const websites = new Set(books.map((book) => book.website));
        if (websites.size < 2) return null;
        const prices = books.map((book) => book.price);
        return {
          comparisonKey,
          books,
          lowestPrice: Math.min(...prices),
          highestPrice: Math.max(...prices),
          cheapest: books.find((book) => book.price === Math.min(...prices)),
        };
      })
      .filter(Boolean);
    const comparisonByKey = new Map(comparisons.map((comparison) => [comparison.comparisonKey, comparison]));
    const enrichedListings = listings.map((book) => {
      const comparison = comparisonByKey.get(getComparisonKey(book));
      return {
        ...book,
        comparisonKey: getComparisonKey(book),
        isLowestPrice: Boolean(comparison && book.price === comparison.lowestPrice),
        savingsVsMaxPercent: comparison && comparison.highestPrice > 0
          ? Number((((comparison.highestPrice - book.price) / comparison.highestPrice) * 100).toFixed(1))
          : 0,
      };
    });
    const singleComparison = comparisons.length === 1 ? comparisons[0] : null;

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      totalOffers: listings.length,
      comparableBookCount: comparisons.length,
      lowestPrice: singleComparison ? singleComparison.lowestPrice : null,
      highestPrice: singleComparison ? singleComparison.highestPrice : null,
      priceDifference: singleComparison
        ? Number((singleComparison.highestPrice - singleComparison.lowestPrice).toFixed(2))
        : 0,
      cheapestSource: singleComparison ? singleComparison.cheapest.website : null,
      websites: [...new Set(listings.map((book) => book.website))],
      listings: enrichedListings,
    });
  } catch (error) {
    console.error('Finnish book search failed:', error.message);
    const pythonExecutable = resolvePythonExecutable();
    console.error(`Finnish book search failed with Python executable "${pythonExecutable}":`, error.message);
    return res.status(502).json({ success: false, message: 'Could not fetch live results from Finnish book websites' });
  }
};

// 1. GET /api/books (with filters, pagination, sorting)
exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 40,
      website,
      condition,
      currency,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (website && website !== 'all') {
      filter.website = website;
    }
    if (condition && condition !== 'all') {
      filter.condition = condition;
    }
    if (currency && currency !== 'all') {
      filter.currency = currency.toUpperCase();
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: books,
    });
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    res.status(500).json({ success: false, message: 'Server error fetching books', error: error.message });
  }
};

// 2. GET /api/books/search?q=harry
exports.searchBooks = async (req, res) => {
  try {
    const { q, website, condition, sortBy = 'price', sortOrder = 'asc' } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter "q" is required',
        data: [],
      });
    }

    const cleanQuery = q.trim();
    const regex = new RegExp(cleanQuery, 'i');

    const filter = {
      $or: [{ title: regex }, { author: regex }, { isbn: regex }],
    };

    if (website && website !== 'all') {
      filter.website = website;
    }
    if (condition && condition !== 'all') {
      filter.condition = condition;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const books = await Book.find(filter).sort(sortOptions).lean();

    res.status(200).json({
      success: true,
      query: cleanQuery,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error('Error in searchBooks:', error);
    res.status(500).json({ success: false, message: 'Server error during search', error: error.message });
  }
};

// 3. GET /api/books/compare?q=harry
exports.compareBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required for price comparison',
      });
    }

    const cleanQuery = q.trim();
    const regex = new RegExp(cleanQuery, 'i');

    const listings = await Book.find({
      $or: [{ title: regex }, { author: regex }, { isbn: regex }],
    })
      .sort({ price: 1 }) // Lowest price first
      .lean();

    if (listings.length === 0) {
      return res.status(200).json({
        success: true,
        query: cleanQuery,
        totalOffers: 0,
        lowestPrice: null,
        highestPrice: null,
        priceDifference: 0,
        cheapestSource: null,
        websites: [],
        listings: [],
      });
    }

    // Calculate comparative metrics
    const prices = listings.map((b) => b.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const priceDifference = Number((highestPrice - lowestPrice).toFixed(2));
    const cheapestItem = listings.find((b) => b.price === lowestPrice);
    const uniqueWebsites = [...new Set(listings.map((b) => b.website))];

    // Enrich listings with comparison indicators
    const enrichedListings = listings.map((item) => {
      const isLowest = item.price === lowestPrice;
      const savingsVsMax = highestPrice > 0 ? Number((((highestPrice - item.price) / highestPrice) * 100).toFixed(1)) : 0;
      return {
        ...item,
        isLowestPrice: isLowest,
        savingsVsMaxPercent: savingsVsMax,
      };
    });

    res.status(200).json({
      success: true,
      query: cleanQuery,
      totalOffers: listings.length,
      lowestPrice,
      highestPrice,
      priceDifference,
      cheapestSource: cheapestItem ? cheapestItem.website : null,
      websites: uniqueWebsites,
      listings: enrichedListings,
    });
  } catch (error) {
    console.error('Error in compareBooks:', error);
    res.status(500).json({ success: false, message: 'Server error during comparison', error: error.message });
  }
};

// 4. GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Book ID format' });
    }

    const book = await Book.findById(id).lean();
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.status(200).json({ success: true, data: book });
  } catch (error) {
    console.error('Error in getBookById:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving book', error: error.message });
  }
};

// 5. GET /api/books/stats/summary
exports.getSummaryStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const websites = await Book.distinct('website');
    const conditions = await Book.distinct('condition');
    const currencies = await Book.distinct('currency');

    res.status(200).json({
      success: true,
      stats: {
        totalBooks,
        websites,
        conditions,
        currencies,
      },
    });
  } catch (error) {
    console.error('Error in getSummaryStats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats', error: error.message });
  }
};

// 6. POST / GET /api/books/seed (Benchmark Data Population)
const BENCHMARK_BOOKS = [
  // --- Harry Potter multi-source comparison ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    edition: "Scholastic 1st Paperback",
    condition: "Good",
    price: 350.0,
    currency: "INR",
    availability: "In Stock",
    website: "BooksToScrape",
    sourceUrl: "https://books.toscrape.com/catalogue/harry-potter-and-the-sorcerers-stone_1001/index.html",
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
  },

  // --- The Great Gatsby comparison ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
  },

  // --- 1984 comparison ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
  },

  // --- To Kill a Mockingbird ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
  },

  // --- Pride and Prejudice ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
  },

  // --- The Hobbit ---
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  },
  {
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
    coverImage: "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
  }
];

exports.seedBooks = async (req, res) => {
  try {
    let inserted = 0;
    let updated = 0;

    for (const book of BENCHMARK_BOOKS) {
      const result = await Book.updateOne(
        { sourceUrl: book.sourceUrl, website: book.website },
        { $set: book },
        { upsert: true }
      );
      if (result.upsertedCount > 0) inserted++;
      else if (result.modifiedCount > 0) updated++;
    }

    const total = await Book.countDocuments();
    res.status(200).json({
      success: true,
      message: 'Benchmark second-hand books populated successfully!',
      stats: { inserted, updated, total },
    });
  } catch (error) {
    console.error('Error seeding books:', error);
    res.status(500).json({ success: false, message: 'Seeding failed', error: error.message });
  }
};

exports.BENCHMARK_BOOKS = BENCHMARK_BOOKS;


