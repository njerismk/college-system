const express = require('express');
const router = express.Router();
const {
  register,
  login,
  updatePassword,
  adminResetPassword,
  getProfile,
} = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});
router.get('/profile', verifyToken, getProfile);
router.put('/update-password', verifyToken, updatePassword);
router.put('/admin-reset-password', verifyToken, authorizeRoles('hod', 'registrar'), adminResetPassword);

module.exports = router;
