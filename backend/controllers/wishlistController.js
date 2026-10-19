const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');

const createBookKey = (book) => {
  if (typeof book.sourceUrl === 'string' && book.sourceUrl.trim()) {
    return `url:${book.sourceUrl.trim()}`;
  }
  if (book._id !== undefined && book._id !== null) {
    return `id:${String(book._id)}`;
  }
  return `title:${book.title.trim().toLowerCase()}|${book.website.trim().toLowerCase()}`;
};

const publicItem = (item) => {
  const book = {
    _id: item.bookId || undefined,
    title: item.title,
    author: item.author,
    isbn: item.isbn,
    edition: item.edition,
    condition: item.condition,
    price: item.price,
    currency: item.currency,
    availability: item.availability,
    sourceUrl: item.sourceUrl,
    website: item.website,
    coverImage: item.coverImage,
  };
  return {
    id: item._id.toString(),
    userId: item.userId.toString(),
    bookId: item.bookId,
    createdAt: item.createdAt,
    book,
  };
};

exports.getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, items: items.map(publicItem) });
  } catch (error) {
    return next(error);
  }
};

exports.addWishlistItem = async (req, res, next) => {
  const book = req.body.book;
  if (!book || typeof book !== 'object' || Array.isArray(book)
    || typeof book.title !== 'string' || !book.title.trim()
    || typeof book.website !== 'string' || !book.website.trim()) {
    return res.status(400).json({ success: false, message: 'A book title and website are required' });
  }

  const safeBook = {
    _id: book._id == null ? undefined : String(book._id),
    title: book.title.trim(),
    author: typeof book.author === 'string' ? book.author : 'Unknown Author',
    isbn: typeof book.isbn === 'string' ? book.isbn : null,
    edition: typeof book.edition === 'string' ? book.edition : null,
    condition: typeof book.condition === 'string' ? book.condition : 'Good',
    price: Number.isFinite(Number(book.price)) ? Number(book.price) : 0,
    currency: typeof book.currency === 'string' ? book.currency : 'INR',
    availability: typeof book.availability === 'string' ? book.availability : 'In Stock',
    sourceUrl: typeof book.sourceUrl === 'string' ? book.sourceUrl : '',
    website: book.website.trim(),
    coverImage: typeof book.coverImage === 'string' ? book.coverImage : null,
  };

  try {
    const bookKey = createBookKey(safeBook);
    const { _id: bookId, ...wishlistBook } = safeBook;
    const item = await Wishlist.findOneAndUpdate(
      { userId: req.userId, bookKey },
      {
        $setOnInsert: {
          userId: req.userId,
          bookKey,
          bookId: bookId || bookKey,
          ...wishlistBook,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, item: publicItem(item) });
  } catch (error) {
    return next(error);
  }
};

exports.removeWishlistItem = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ success: false, message: 'Wishlist item not found' });
  }

  try {
    const result = await Wishlist.deleteOne({ _id: req.params.id, userId: req.userId });
    if (!result.deletedCount) {
      return res.status(404).json({ success: false, message: 'Wishlist item not found' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

exports.clearWishlist = async (req, res, next) => {
  try {
    await Wishlist.deleteMany({ userId: req.userId });
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};
