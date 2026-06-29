const pool = require('../config/db');

// Create a timetable slot (lecturer or HOD)
exports.createSlot = async (req, res) => {
  try {
    const { course_id, day_of_week, start_time, end_time, room } = req.body;

    if (!course_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({ message: 'course_id, day_of_week, start_time, and end_time are required' });
    }

    // If lecturer, ensure they own this course
    if (req.user.role === 'lecturer') {
      const [check] = await pool.query(
        'SELECT c.id FROM courses c JOIN staff s ON c.lecturer_id = s.id WHERE c.id = ? AND s.user_id = ?',
        [course_id, req.user.id]
      );
      if (check.length === 0) {
        return res.status(403).json({ message: 'Access denied: not your course' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO timetable_slots (course_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)',
      [course_id, day_of_week, start_time, end_time, room || null]
    );

    res.status(201).json({ message: 'Timetable slot created', slotId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating timetable slot' });
  }
};

// Get all timetable slots (everyone can view)
exports.getAllSlots = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room,
             c.name AS course_name, c.code AS course_code
      FROM timetable_slots ts
      JOIN courses c ON ts.course_id = c.id
      ORDER BY ts.day_of_week, ts.start_time
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching timetable' });
  }
};

// Get timetable for a specific course
exports.getSlotsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM timetable_slots WHERE course_id = ? ORDER BY day_of_week, start_time',
      [courseId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching course timetable' });
  }
};

// Update a slot (lecturer who owns it, or HOD)
exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, room } = req.body;

    if (req.user.role === 'lecturer') {
      const [check] = await pool.query(
        `SELECT ts.id FROM timetable_slots ts
         JOIN courses c ON ts.course_id = c.id
         JOIN staff s ON c.lecturer_id = s.id
         WHERE ts.id = ? AND s.user_id = ?`,
        [id, req.user.id]
      );
      if (check.length === 0) {
        return res.status(403).json({ message: 'Access denied: not your timetable slot' });
      }
    }

    await pool.query(
      'UPDATE timetable_slots SET day_of_week = ?, start_time = ?, end_time = ?, room = ? WHERE id = ?',
      [day_of_week, start_time, end_time, room, id]
    );

    res.json({ message: 'Timetable slot updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating timetable slot' });
  }
};

// Delete a slot (HOD only)
exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM timetable_slots WHERE id = ?', [id]);
    res.json({ message: 'Timetable slot deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting timetable slot' });
  }
};
