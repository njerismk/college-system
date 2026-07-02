const express = require('express');
const router = express.Router();
const {
  recordPayment,
  getAllPayments,
  getStudentPayments,
  getMyBalance,
} = require('../controllers/financeController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/payments', authorizeRoles('finance', 'hod'), recordPayment);
router.get('/payments', authorizeRoles('finance', 'hod'), getAllPayments);
router.get('/payments/student/:studentId', authorizeRoles('finance', 'hod', 'registrar'), getStudentPayments);
router.get('/my-balance', authorizeRoles('student'), getMyBalance);

module.exports = router;
