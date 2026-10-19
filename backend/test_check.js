const mongoose = require('mongoose');
const User = require('./models/User');
const Wishlist = require('./models/Wishlist');
const Book = require('./models/Book');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/second_hand_books');
    console.log('MongoDB connected successfully');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in second_hand_books:', collections.map(c => c.name));
    
    const userCount = await User.countDocuments();
    const wishlistCount = await Wishlist.countDocuments();
    const bookCount = await Book.countDocuments();
    console.log(`Users: ${userCount}, Wishlist: ${wishlistCount}, Books: ${bookCount}`);
    
    const users = await User.find({}, '-password').lean();
    console.log('Users in DB:', users);
    
    const wishlistItems = await Wishlist.find({}).lean();
    console.log('Wishlist items in DB:', wishlistItems);
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
