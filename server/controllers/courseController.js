const pool = require('../config/db');

// Create a course (HOD/Registrar only)
exports.createCourse = async (req, res) => {
  try {
    const { name, code, programme_id, lecturer_id } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'name and code are required' });
    }

    const [existing] = await pool.query('SELECT id FROM courses WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Course code already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (name, code, programme_id, lecturer_id) VALUES (?, ?, ?, ?)',
      [name, code, programme_id || null, lecturer_id || null]
    );

    res.status(201).json({ message: 'Course created', courseId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating course' });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.code,
             p.name AS programme,
             s.full_name AS lecturer
      FROM courses c
      LEFT JOIN programmes p ON c.programme_id = p.id
      LEFT JOIN staff s ON c.lecturer_id = s.id
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

// Get courses assigned to the logged-in lecturer
exports.getMyCourses = async (req, res) => {
  try {
    const [staff] = await pool.query(
      'SELECT id FROM staff WHERE user_id = ?', [req.user.id]
    );
    if (staff.length === 0) {
      return res.status(404).json({ message: 'Staff record not found for this user' });
    }

    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.code, p.name AS programme
      FROM courses c
      LEFT JOIN programmes p ON c.programme_id = p.id
      WHERE c.lecturer_id = ?
    `, [staff[0].id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your courses' });
  }
};

// Get single course
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT c.*, p.name AS programme, s.full_name AS lecturer
      FROM courses c
      LEFT JOIN programmes p ON c.programme_id = p.id
      LEFT JOIN staff s ON c.lecturer_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching course' });
  }
};

// Update a course (HOD/Registrar only)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, programme_id, lecturer_id } = req.body;

    await pool.query(
      'UPDATE courses SET name = ?, code = ?, programme_id = ?, lecturer_id = ? WHERE id = ?',
      [name, code, programme_id, lecturer_id, id]
    );

    res.json({ message: 'Course updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating course' });
  }
};

// Delete a course (HOD only)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting course' });
  }
};
