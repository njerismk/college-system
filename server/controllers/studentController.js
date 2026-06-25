const pool = require('../config/db');

// Create a student (registrar/HOD only)
exports.createStudent = async (req, res) => {
  try {
    const { user_id, reg_number, full_name, programme_id, year_of_study } = req.body;

    if (!user_id || !reg_number || !full_name) {
      return res.status(400).json({ message: 'user_id, reg_number, and full_name are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO students (user_id, reg_number, full_name, programme_id, year_of_study) VALUES (?, ?, ?, ?, ?)',
      [user_id, reg_number, full_name, programme_id || null, year_of_study || null]
    );

    res.status(201).json({ message: 'Student created', studentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating student' });
  }
};

// Get all students (registrar/HOD/tutor/lecturer)
exports.getAllStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.id, s.reg_number, s.full_name, s.year_of_study, p.name AS programme FROM students s LEFT JOIN programmes p ON s.programme_id = p.id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// Get a single student by id
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // If the requester is a student, they can only view their own record
    if (req.user.role === 'student') {
      const [check] = await pool.query('SELECT user_id FROM students WHERE id = ?', [id]);
      if (check.length === 0) return res.status(404).json({ message: 'Student not found' });
      if (check[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: not your record' });
      }
    }

    const [rows] = await pool.query(
      'SELECT s.*, p.name AS programme FROM students s LEFT JOIN programmes p ON s.programme_id = p.id WHERE s.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student' });
  }
};

// Update a student (registrar/HOD only)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, programme_id, year_of_study } = req.body;

    await pool.query(
      'UPDATE students SET full_name = ?, programme_id = ?, year_of_study = ? WHERE id = ?',
      [full_name, programme_id, year_of_study, id]
    );

    res.json({ message: 'Student updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

// Delete a student (registrar/HOD only)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};
