const pool = require('../config/db');

// Enter result (lecturer/hod only)
exports.enterResult = async (req, res) => {
  try {
    const { student_id, course_id, score, grade, semester } = req.body;

    if (!student_id || !course_id || !score) {
      return res.status(400).json({ message: 'student_id, course_id, and score are required' });
    }

    // Check if result already exists
    const [existing] = await pool.query(
      'SELECT id FROM results WHERE student_id = ? AND course_id = ? AND semester = ?',
      [student_id, course_id, semester]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE results SET score = ?, grade = ? WHERE id = ?',
        [score, grade || null, existing[0].id]
      );
      return res.json({ message: 'Result updated' });
    }

    const [result] = await pool.query(
      'INSERT INTO results (student_id, course_id, score, grade, semester) VALUES (?, ?, ?, ?, ?)',
      [student_id, course_id, score, grade || null, semester || null]
    );

    res.status(201).json({ message: 'Result entered', resultId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error entering result' });
  }
};

// Get own results (student)
exports.getMyResults = async (req, res) => {
  try {
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const [rows] = await pool.query(`
      SELECT r.score, r.grade, r.semester,
             c.name AS course_name, c.code AS course_code
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.student_id = ?
      ORDER BY r.semester, c.name
    `, [student[0].id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching results' });
  }
};

// Get all results for a course (lecturer/hod)
exports.getCourseResults = async (req, res) => {
  try {
    const { courseId } = req.params;

    const [rows] = await pool.query(`
      SELECT r.score, r.grade, r.semester,
             s.full_name AS student_name, s.reg_number
      FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE r.course_id = ?
      ORDER BY s.full_name
    `, [courseId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching course results' });
  }
};

// Get all results for a student (registrar/hod — for transcripts)
exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await pool.query(`
      SELECT r.score, r.grade, r.semester,
             c.name AS course_name, c.code AS course_code
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.student_id = ?
      ORDER BY r.semester, c.name
    `, [studentId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student results' });
  }
};
