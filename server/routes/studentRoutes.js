const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken); // all routes below require a valid token

router.post('/', authorizeRoles('registrar', 'hod'), createStudent);
router.get('/', authorizeRoles('registrar', 'hod', 'tutor', 'lecturer'), getAllStudents);
router.get('/:id', getStudentById); // role check happens inside the controller
router.put('/:id', authorizeRoles('registrar', 'hod'), updateStudent);
router.delete('/:id', authorizeRoles('registrar', 'hod'), deleteStudent);

module.exports = router;
