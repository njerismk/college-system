const express = require('express');
const router = express.Router();
const {
  enterResult,
  getMyResults,
  getCourseResults,
  getStudentResults,
} = require('../controllers/resultsController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', authorizeRoles('lecturer', 'hod'), enterResult);
router.get('/my', authorizeRoles('student'), getMyResults);
router.get('/course/:courseId', authorizeRoles('lecturer', 'hod'), getCourseResults);
router.get('/student/:studentId', authorizeRoles('hod', 'registrar'), getStudentResults);

module.exports = router;
