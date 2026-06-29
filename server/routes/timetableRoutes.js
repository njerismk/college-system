const express = require('express');
const router = express.Router();
const {
  createSlot,
  getAllSlots,
  getSlotsByCourse,
  updateSlot,
  deleteSlot,
} = require('../controllers/timetableController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', authorizeRoles('lecturer', 'hod'), createSlot);
router.get('/', getAllSlots); // anyone logged in can view
router.get('/course/:courseId', getSlotsByCourse);
router.put('/:id', authorizeRoles('lecturer', 'hod'), updateSlot);
router.delete('/:id', authorizeRoles('hod'), deleteSlot);

module.exports = router;
