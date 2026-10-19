const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookKey: {
      type: String,
      required: true,
    },
    bookId: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: 'Unknown Author',
    },
    isbn: {
      type: String,
      default: null,
    },
    edition: {
      type: String,
      default: null,
    },
    condition: {
      type: String,
      default: 'Good',
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    availability: {
      type: String,
      default: 'In Stock',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: 'wishlist' }
);

wishlistSchema.index({ userId: 1, bookKey: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
