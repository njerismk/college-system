const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getSlotAttendance,
  getMyAttendance,
  getStudentAttendance,
} = require('../controllers/attendanceController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', authorizeRoles('tutor', 'lecturer', 'hod'), markAttendance);
router.get('/my', authorizeRoles('student'), getMyAttendance);
router.get('/slot/:slotId/:date', authorizeRoles('tutor', 'lecturer', 'hod'), getSlotAttendance);
router.get('/student/:studentId', authorizeRoles('hod', 'registrar'), getStudentAttendance);

module.exports = router;
