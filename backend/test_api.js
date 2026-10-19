const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Wishlist = require('./models/Wishlist');
const { register, login } = require('./controllers/authController');
const { addWishlistItem, getWishlist, removeWishlistItem, clearWishlist } = require('./controllers/wishlistController');

async function run() {
  process.env.JWT_SECRET = 'test_secret_for_jwt_testing_1234567890';
  await mongoose.connect('mongodb://localhost:27017/second_hand_books');
  console.log('Connected to DB');

  // Clean test data
  await User.deleteMany({ email: 'test@example.com' });

  // 1. Test Register
  let resStatus = null;
  let resJson = null;
  const mockRes = () => {
    const res = {
      status(s) { resStatus = s; return res; },
      json(j) { resJson = j; return res; }
    };
    return res;
  };

  console.log('--- TEST 1: Register ---');
  await register({
    body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
  }, mockRes(), (err) => console.error('Register next error:', err));
  console.log('Register response status:', resStatus, 'body:', resJson);

  // 2. Test Login
  console.log('--- TEST 2: Login ---');
  await login({
    body: { email: 'test@example.com', password: 'password123' }
  }, mockRes(), (err) => console.error('Login next error:', err));
  console.log('Login response status:', resStatus, 'body:', resJson);
  const token = resJson ? resJson.token : null;
  const userId = resJson && resJson.user ? resJson.user.id : null;

  // 3. Test Add to Wishlist with a Benchmark Book (has string _id e.g. "hp-bc")
  console.log('--- TEST 3: Add Wishlist with string _id ("hp-bc") ---');
  const bookToAdd = {
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
  };

  await addWishlistItem({
    userId,
    body: { book: bookToAdd }
  }, mockRes(), (err) => console.error('Add Wishlist next error:', err));
  console.log('Add Wishlist response status:', resStatus, 'body:', resJson);

  if (resJson && resJson.item) {
    const addedId = resJson.item.id;
    console.log('--- TEST 4: Remove Wishlist Item ---');
    await removeWishlistItem({
      userId,
      params: { id: addedId }
    }, mockRes(), (err) => console.error('Remove Wishlist next error:', err));
    console.log('Remove Wishlist response status:', resStatus, 'body:', resJson);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
