const express = require('express');
const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
} = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);
router.get('/', getWishlist);
router.post('/', addWishlistItem);
router.delete('/', clearWishlist);
router.delete('/:id', removeWishlistItem);

module.exports = router;
