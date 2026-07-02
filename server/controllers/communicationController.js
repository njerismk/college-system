const pool = require('../config/db');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, subject, body } = req.body;

    if (!receiver_id || !body) {
      return res.status(400).json({ message: 'receiver_id and body are required' });
    }

    // Confirm receiver exists
    const [receiver] = await pool.query(
      'SELECT id FROM users WHERE id = ?', [receiver_id]
    );
    if (receiver.length === 0) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?)',
      [req.user.id, receiver_id, subject || null, body]
    );

    res.status(201).json({ message: 'Message sent', messageId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// Get inbox (messages received)
exports.getInbox = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.id, m.subject, m.body, m.is_read, m.created_at,
             u.email AS sender_email,
             COALESCE(s.full_name, st.full_name) AS sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN staff st ON u.id = st.user_id
      WHERE m.receiver_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching inbox' });
  }
};

// Get sent messages
exports.getSent = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.id, m.subject, m.body, m.is_read, m.created_at,
             u.email AS receiver_email,
             COALESCE(s.full_name, st.full_name) AS receiver_name
      FROM messages m
      JOIN users u ON m.receiver_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN staff st ON u.id = st.user_id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching sent messages' });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Only the receiver can mark as read
    const [check] = await pool.query(
      'SELECT id FROM messages WHERE id = ? AND receiver_id = ?',
      [id, req.user.id]
    );
    if (check.length === 0) {
      return res.status(403).json({ message: 'Access denied or message not found' });
    }

    await pool.query('UPDATE messages SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Message marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error marking message as read' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Only sender or receiver can delete
    const [check] = await pool.query(
      'SELECT id FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
      [id, req.user.id, req.user.id]
    );
    if (check.length === 0) {
      return res.status(403).json({ message: 'Access denied or message not found' });
    }

    await pool.query('DELETE FROM messages WHERE id = ?', [id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting message' });
  }
};
