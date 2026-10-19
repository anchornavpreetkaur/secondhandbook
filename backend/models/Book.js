const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      default: 'Unknown Author',
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    edition: {
      type: String,
      trim: true,
      default: null,
    },
    condition: {
      type: String,
      trim: true,
      default: 'Good',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    availability: {
      type: String,
      default: 'In Stock',
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
    },
    website: {
      type: String,
      required: [true, 'Website identifier is required'],
      trim: true,
      index: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: null,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'books',
    timestamps: true,
  }
);

// Compound unique index for sourceUrl and website
bookSchema.index({ sourceUrl: 1, website: 1 }, { unique: true });

// Text index for unified multi-field search
bookSchema.index(
  { title: 'text', author: 'text', isbn: 'text' },
  { weights: { title: 10, author: 5, isbn: 3 }, name: 'TextSearchIndex' }
);

module.exports = mongoose.model('Book', bookSchema);
