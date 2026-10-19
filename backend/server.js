require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const { getJwtSecret } = require('./middleware/requireAuth');
const User = require('./models/User');
const Wishlist = require('./models/Wishlist');

const app = express();
const PORT = process.env.PORT || 5000;

const toWishlistRecord = (userId, entry) => {
  const book = entry.book || entry;
  return {
    _id: entry._id,
    userId,
    bookKey: entry.bookKey,
    bookId: book._id == null ? null : String(book._id),
    title: book.title,
    author: book.author || 'Unknown Author',
    isbn: book.isbn || null,
    edition: book.edition || null,
    condition: book.condition || 'Good',
    price: Number.isFinite(Number(book.price)) ? Number(book.price) : 0,
    currency: book.currency || 'INR',
    availability: book.availability || 'In Stock',
    sourceUrl: book.sourceUrl || '',
    website: book.website,
    coverImage: book.coverImage || null,
    addedAt: entry.addedAt || entry.createdAt || new Date(),
  };
};

const migrateWishlistToCollection = async (connection) => {
  const database = connection.connection.db;
  const collectionExists = await database.listCollections({ name: 'wishlist' }).hasNext();
  const collection = database.collection('wishlist');
  const embeddedUsers = await database.collection('users')
    .find({ 'wishlist.0': { $exists: true } }).toArray();

  for (const user of embeddedUsers) {
    for (const entry of user.wishlist) {
      const record = toWishlistRecord(user._id, entry);
      if (!record.bookKey || !record.title || !record.website) {
        throw new Error(`Cannot migrate embedded wishlist entry ${entry._id}: required book fields are missing`);
      }
      const { _id, userId, bookKey, ...fields } = record;
      await Wishlist.updateOne(
        { userId, bookKey },
        { $setOnInsert: { _id, userId, bookKey, ...fields } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      if (!(await Wishlist.exists({ userId, bookKey }))) {
        throw new Error(`Could not migrate embedded wishlist entry ${entry._id}`);
      }
    }
  }

  if (collectionExists) {
    const legacyEntries = await collection.find({}).toArray();
    for (const entry of legacyEntries) {
      const record = toWishlistRecord(entry.userId, entry);
      if (!entry.userId || !record.bookKey || !record.title || !record.website) {
        throw new Error(`Cannot migrate wishlist entry ${entry._id}: required book fields are missing`);
      }
      const { _id, ...fields } = record;
      await collection.updateOne(
        { _id },
        { $set: fields, $unset: { book: '' } }
      );
      if (!(await Wishlist.exists({ _id, userId: entry.userId, bookKey: entry.bookKey }))) {
        throw new Error(`Could not migrate wishlist entry ${entry._id}`);
      }
    }
  }

  for (const user of embeddedUsers) {
    await database.collection('users').updateOne({ _id: user._id }, { $unset: { wishlist: '' } });
  }

  if (embeddedUsers.length) {
    console.log(`[MongoDB] Migrated wishlist books from ${embeddedUsers.length} user account(s) into the wishlist collection.`);
  }
};

try {
  getJwtSecret();
} catch (error) {
  console.error(`[Authentication Configuration Error] ${error.message}. Set JWT_SECRET in backend/.env.`);
  process.exit(1);
}

// Connect to Database & Auto-populate if empty
connectDB().then(async (conn) => {
  if (conn) {
    try {
      await migrateWishlistToCollection(conn);
    } catch (err) {
      console.error(`[MongoDB] Wishlist migration failed; source data was preserved: ${err.message}`);
    }

    try {
      const Book = require('./models/Book');
      const { BENCHMARK_BOOKS } = require('./controllers/bookController');
      if (BENCHMARK_BOOKS && BENCHMARK_BOOKS.length > 0) {
        for (const book of BENCHMARK_BOOKS) {
          await Book.updateOne(
            { title: book.title, website: book.website },
            { $set: book },
            { upsert: true }
          );
        }
        const totalInDb = await Book.countDocuments();
        console.log(`[MongoDB] Database ready. Total books in collection: ${totalInDb}`);
      }
    } catch (err) {
      console.warn('[MongoDB] Auto-populate check:', err.message);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for development / audit
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Second-Hand Book Price Comparison API',
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Root informative endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Second-Hand Book Price Comparison API',
    endpoints: {
      health: 'GET /api/health',
      allBooks: 'GET /api/books',
      search: 'GET /api/books/search?q={term}',
      compare: 'GET /api/books/compare?q={term}',
      stats: 'GET /api/books/stats/summary',
      details: 'GET /api/books/:id',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Second-Hand Book Backend Server Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` API Base:     http://localhost:${PORT}/api/books`);
  console.log(`====================================================`);
});

module.exports = { app, server };
