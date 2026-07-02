const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getMyCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', authorizeRoles('hod', 'registrar'), createCourse);
router.get('/', getAllCourses);
router.get('/my', authorizeRoles('lecturer', 'tutor'), getMyCourses);
router.get('/:id', getCourseById);
router.put('/:id', authorizeRoles('hod', 'registrar'), updateCourse);
router.delete('/:id', authorizeRoles('hod'), deleteCourse);

module.exports = router;
