const pool = require('../config/db');

// Mark attendance (tutor/lecturer only)
exports.markAttendance = async (req, res) => {
  try {
    const { student_id, timetable_slot_id, date, status } = req.body;

    if (!student_id || !timetable_slot_id || !date) {
      return res.status(400).json({ message: 'student_id, timetable_slot_id, and date are required' });
    }

    // Get staff id of the person marking
    const [staff] = await pool.query(
      'SELECT id FROM staff WHERE user_id = ?', [req.user.id]
    );
    if (staff.length === 0) {
      return res.status(404).json({ message: 'Staff record not found' });
    }

    // Check if attendance already marked for this student/slot/date
    const [existing] = await pool.query(
      'SELECT id FROM attendance_records WHERE student_id = ? AND timetable_slot_id = ? AND date = ?',
      [student_id, timetable_slot_id, date]
    );

    if (existing.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE attendance_records SET status = ?, marked_by = ? WHERE id = ?',
        [status || 'present', staff[0].id, existing[0].id]
      );
      return res.json({ message: 'Attendance updated' });
    }

    // Insert new record
    const [result] = await pool.query(
      'INSERT INTO attendance_records (student_id, timetable_slot_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)',
      [student_id, timetable_slot_id, date, status || 'present', staff[0].id]
    );

    res.status(201).json({ message: 'Attendance marked', recordId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error marking attendance' });
  }
};

// Get attendance for a specific timetable slot and date (tutor/lecturer/hod)
exports.getSlotAttendance = async (req, res) => {
  try {
    const { slotId, date } = req.params;

    const [rows] = await pool.query(`
      SELECT ar.id, ar.status, ar.date,
             s.full_name AS student_name, s.reg_number,
             st.full_name AS marked_by
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      LEFT JOIN staff st ON ar.marked_by = st.id
      WHERE ar.timetable_slot_id = ? AND ar.date = ?
      ORDER BY s.full_name
    `, [slotId, date]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// Get a student's own attendance (student only)
exports.getMyAttendance = async (req, res) => {
  try {
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const [rows] = await pool.query(`
      SELECT ar.date, ar.status,
             c.name AS course_name,
             ts.day_of_week, ts.start_time, ts.end_time
      FROM attendance_records ar
      JOIN timetable_slots ts ON ar.timetable_slot_id = ts.id
      JOIN courses c ON ts.course_id = c.id
      WHERE ar.student_id = ?
      ORDER BY ar.date DESC
    `, [student[0].id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your attendance' });
  }
};

// Get attendance summary for a student (hod/registrar)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await pool.query(`
      SELECT ar.date, ar.status,
             c.name AS course_name,
             ts.day_of_week, ts.start_time
      FROM attendance_records ar
      JOIN timetable_slots ts ON ar.timetable_slot_id = ts.id
      JOIN courses c ON ts.course_id = c.id
      WHERE ar.student_id = ?
      ORDER BY ar.date DESC
    `, [studentId]);

    // Calculate summary
    const total = rows.length;
    const present = rows.filter(r => r.status === 'present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ summary: { total, present, percentage }, records: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student attendance' });
  }
};
