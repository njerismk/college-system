const express = require('express');
const router = express.Router();
const {
  attendanceReport,
  financeReport,
  academicReport,
  departmentReport,
} = require('../controllers/reportsController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.get('/attendance', authorizeRoles('hod', 'registrar', 'tutor', 'lecturer'), attendanceReport);
router.get('/finance', authorizeRoles('hod', 'finance'), financeReport);
router.get('/academic', authorizeRoles('hod', 'registrar', 'lecturer'), academicReport);
router.get('/department', authorizeRoles('hod'), departmentReport);

module.exports = router;
