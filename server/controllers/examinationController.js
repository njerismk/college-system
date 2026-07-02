const pool = require('../config/db');

// Schedule an exam (HOD/Registrar only)
exports.scheduleExam = async (req, res) => {
  try {
    const { course_id, exam_date, start_time, end_time, venue, invigilator_id, academic_year, semester } = req.body;

    if (!course_id || !exam_date || !start_time || !end_time) {
      return res.status(400).json({ message: 'course_id, exam_date, start_time, and end_time are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO exam_schedule 
       (course_id, exam_date, start_time, end_time, venue, invigilator_id, academic_year, semester) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, exam_date, start_time, end_time, venue || null, invigilator_id || null, academic_year || null, semester || null]
    );

    res.status(201).json({ message: 'Exam scheduled', examId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error scheduling exam' });
  }
};

// Get all exam schedules (everyone can view)
exports.getAllExams = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT es.id, es.exam_date, es.start_time, es.end_time,
             es.venue, es.academic_year, es.semester,
             c.name AS course_name, c.code AS course_code,
             s.full_name AS invigilator
      FROM exam_schedule es
      JOIN courses c ON es.course_id = c.id
      LEFT JOIN staff s ON es.invigilator_id = s.id
      ORDER BY es.exam_date, es.start_time
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching exams' });
  }
};

// Get exams for a specific course
exports.getExamsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await pool.query(`
      SELECT es.*, c.name AS course_name, s.full_name AS invigilator
      FROM exam_schedule es
      JOIN courses c ON es.course_id = c.id
      LEFT JOIN staff s ON es.invigilator_id = s.id
      WHERE es.course_id = ?
      ORDER BY es.exam_date
    `, [courseId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching course exams' });
  }
};

// Update exam schedule (HOD/Registrar only)
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_date, start_time, end_time, venue, invigilator_id, academic_year, semester } = req.body;

    await pool.query(
      `UPDATE exam_schedule 
       SET exam_date=?, start_time=?, end_time=?, venue=?, invigilator_id=?, academic_year=?, semester=? 
       WHERE id=?`,
      [exam_date, start_time, end_time, venue, invigilator_id, academic_year, semester, id]
    );

    res.json({ message: 'Exam updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating exam' });
  }
};

// Delete exam (HOD only)
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM exam_schedule WHERE id = ?', [id]);
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting exam' });
  }
};

// Enter exam result (lecturer/hod only)
exports.enterExamResult = async (req, res) => {
  try {
    const { student_id, exam_schedule_id, score, grade, remarks } = req.body;

    if (!student_id || !exam_schedule_id || !score) {
      return res.status(400).json({ message: 'student_id, exam_schedule_id, and score are required' });
    }

    const [staff] = await pool.query(
      'SELECT id FROM staff WHERE user_id = ?', [req.user.id]
    );

    // Check if result already exists
    const [existing] = await pool.query(
      'SELECT id FROM exam_results WHERE student_id = ? AND exam_schedule_id = ?',
      [student_id, exam_schedule_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE exam_results SET score=?, grade=?, remarks=? WHERE id=?',
        [score, grade || null, remarks || null, existing[0].id]
      );
      return res.json({ message: 'Exam result updated' });
    }

    const [result] = await pool.query(
      `INSERT INTO exam_results (student_id, exam_schedule_id, score, grade, remarks, entered_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, exam_schedule_id, score, grade || null, remarks || null, staff[0]?.id || null]
    );

    res.status(201).json({ message: 'Exam result entered', resultId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error entering exam result' });
  }
};

// Get exam results for a schedule (lecturer/hod)
exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const [rows] = await pool.query(`
      SELECT er.score, er.grade, er.remarks,
             s.full_name AS student_name, s.reg_number,
             c.name AS course_name, es.exam_date
      FROM exam_results er
      JOIN students s ON er.student_id = s.id
      JOIN exam_schedule es ON er.exam_schedule_id = es.id
      JOIN courses c ON es.course_id = c.id
      WHERE er.exam_schedule_id = ?
      ORDER BY s.full_name
    `, [examId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching exam results' });
  }
};

// Get own exam results (student)
exports.getMyExamResults = async (req, res) => {
  try {
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const [rows] = await pool.query(`
      SELECT er.score, er.grade, er.remarks,
             c.name AS course_name, c.code,
             es.exam_date, es.semester, es.academic_year
      FROM exam_results er
      JOIN exam_schedule es ON er.exam_schedule_id = es.id
      JOIN courses c ON es.course_id = c.id
      WHERE er.student_id = ?
      ORDER BY es.exam_date DESC
    `, [student[0].id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your exam results' });
  }
};
