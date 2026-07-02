const express = require('express');
const router = express.Router();
const {
  addBook,
  getAllBooks,
  issueBook,
  returnBook,
  getActiveLoans,
  getMyLoans,
} = require('../controllers/libraryController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/books', authorizeRoles('librarian'), addBook);
router.get('/books', getAllBooks);
router.post('/issue', authorizeRoles('librarian'), issueBook);
router.post('/return', authorizeRoles('librarian'), returnBook);
router.get('/loans', authorizeRoles('librarian', 'hod'), getActiveLoans);
router.get('/my-loans', authorizeRoles('student'), getMyLoans);

module.exports = router;
