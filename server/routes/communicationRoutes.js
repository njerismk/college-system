const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getInbox,
  getSent,
  markAsRead,
  deleteMessage,
} = require('../controllers/communicationController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // all logged-in users can message

router.post('/', sendMessage);
router.get('/inbox', getInbox);
router.get('/sent', getSent);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;
