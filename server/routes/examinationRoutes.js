const express = require('express');
const router = express.Router();
const {
  scheduleExam,
  getAllExams,
  getExamsByCourse,
  updateExam,
  deleteExam,
  enterExamResult,
  getExamResults,
  getMyExamResults,
} = require('../controllers/examinationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.use(verifyToken);

router.post('/schedule', authorizeRoles('hod', 'registrar'), scheduleExam);
router.get('/schedule', getAllExams);
router.get('/schedule/course/:courseId', getExamsByCourse);
router.put('/schedule/:id', authorizeRoles('hod', 'registrar'), updateExam);
router.delete('/schedule/:id', authorizeRoles('hod'), deleteExam);

router.post('/results', authorizeRoles('lecturer', 'hod'), enterExamResult);
router.get('/results/:examId', authorizeRoles('lecturer', 'hod', 'registrar'), getExamResults);
router.get('/my-results', authorizeRoles('student'), getMyExamResults);

module.exports = router;
