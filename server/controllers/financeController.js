const pool = require('../config/db');

// Record a payment (finance officer only)
exports.recordPayment = async (req, res) => {
  try {
    const { student_id, amount_paid, payment_date, payment_method, receipt_number } = req.body;

    if (!student_id || !amount_paid || !payment_date) {
      return res.status(400).json({ message: 'student_id, amount_paid, and payment_date are required' });
    }

    const [staff] = await pool.query(
      'SELECT id FROM staff WHERE user_id = ?', [req.user.id]
    );

    const [result] = await pool.query(
      'INSERT INTO fee_payments (student_id, amount_paid, payment_date, payment_method, receipt_number, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, amount_paid, payment_date, payment_method || 'cash', receipt_number || null, staff[0]?.id || null]
    );

    res.status(201).json({ message: 'Payment recorded', paymentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error recording payment' });
  }
};

// Get all payments (finance/hod)
exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT fp.id, fp.amount_paid, fp.payment_date,
             fp.payment_method, fp.receipt_number,
             s.full_name AS student_name, s.reg_number
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      ORDER BY fp.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

// Get a student's payment history
exports.getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [rows] = await pool.query(`
      SELECT fp.amount_paid, fp.payment_date,
             fp.payment_method, fp.receipt_number
      FROM fee_payments fp
      WHERE fp.student_id = ?
      ORDER BY fp.payment_date DESC
    `, [studentId]);

    // Get fee structure for their programme
    const [student] = await pool.query(
      'SELECT programme_id FROM students WHERE id = ?', [studentId]
    );

    let totalFee = 0;
    if (student[0]?.programme_id) {
      const [fee] = await pool.query(
        'SELECT amount FROM fee_structures WHERE programme_id = ? LIMIT 1',
        [student[0].programme_id]
      );
      totalFee = fee[0]?.amount || 0;
    }

    const totalPaid = rows.reduce((sum, r) => sum + parseFloat(r.amount_paid), 0);
    const balance = totalFee - totalPaid;

    res.json({
      summary: { totalFee, totalPaid, balance },
      payments: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching student payments' });
  }
};

// Get own fee balance (student)
exports.getMyBalance = async (req, res) => {
  try {
    const [student] = await pool.query(
      'SELECT id, programme_id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const [payments] = await pool.query(
      'SELECT amount_paid, payment_date, payment_method, receipt_number FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC',
      [student[0].id]
    );

    let totalFee = 0;
    if (student[0].programme_id) {
      const [fee] = await pool.query(
        'SELECT amount FROM fee_structures WHERE programme_id = ? LIMIT 1',
        [student[0].programme_id]
      );
      totalFee = fee[0]?.amount || 0;
    }

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
    const balance = totalFee - totalPaid;

    res.json({
      summary: { totalFee, totalPaid, balance },
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching balance' });
  }
};
