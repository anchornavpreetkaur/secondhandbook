const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  searchBooks,
  compareBooks,
  getBookById,
  getSummaryStats,
  searchFinnishBooks,
  seedBooks,
} = require('../controllers/bookController');

// Specific endpoints before parameter routes
router.get('/live-search', searchFinnishBooks);
router.get('/search', searchBooks);
router.get('/compare', compareBooks);
router.get('/stats/summary', getSummaryStats);
router.get('/seed', seedBooks);
router.post('/seed', seedBooks);
router.get('/', getAllBooks);
router.get('/:id', getBookById);

module.exports = router;
