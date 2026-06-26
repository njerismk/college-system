const pool = require('../config/db');

exports.createStaff = async (req, res) => {
  try {
    const { user_id, staff_number, full_name, department } = req.body;

    if (!user_id || !staff_number || !full_name) {
      return res.status(400).json({ message: 'user_id, staff_number, and full_name are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO staff (user_id, staff_number, full_name, department) VALUES (?, ?, ?, ?)',
      [user_id, staff_number, full_name, department || null]
    );

    res.status(201).json({ message: 'Staff created', staffId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating staff' });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, staff_number, full_name, department FROM staff');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching staff' });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    // Staff can only view their own record unless they're HOD
    if (req.user.role !== 'hod') {
      const [check] = await pool.query('SELECT user_id FROM staff WHERE id = ?', [id]);
      if (check.length === 0) return res.status(404).json({ message: 'Staff not found' });
      if (check[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: not your record' });
      }
    }

    const [rows] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Staff not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching staff' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, department } = req.body;

    await pool.query(
      'UPDATE staff SET full_name = ?, department = ? WHERE id = ?',
      [full_name, department, id]
    );

    res.json({ message: 'Staff updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating staff' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM staff WHERE id = ?', [id]);
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting staff' });
  }
};
