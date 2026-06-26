const express = require('express');
const router = express.Router();
const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', authorizeRoles('hod'), createStaff);
router.get('/', authorizeRoles('hod'), getAllStaff);
router.get('/:id', getStaffById); // role check inside controller
router.put('/:id', authorizeRoles('hod'), updateStaff);
router.delete('/:id', authorizeRoles('hod'), deleteStaff);

module.exports = router;
