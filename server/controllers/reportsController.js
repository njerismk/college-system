const pool = require('../config/db');

// Attendance report — summary per student
exports.attendanceReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.reg_number,
        s.full_name,
        p.name AS programme,
        COUNT(ar.id) AS total_classes,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late,
        ROUND(
          (SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) / COUNT(ar.id)) * 100, 1
        ) AS attendance_percentage
      FROM students s
      LEFT JOIN attendance_records ar ON s.id = ar.student_id
      LEFT JOIN programmes p ON s.programme_id = p.id
      GROUP BY s.id
      ORDER BY attendance_percentage ASC
    `);

    // Flag students below 75%
    const flagged = rows.filter(r => r.attendance_percentage < 75);

    res.json({
      report_type: 'Attendance Summary',
      generated_at: new Date().toISOString(),
      total_students: rows.length,
      flagged_count: flagged.length,
      data: rows,
      flagged_students: flagged,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating attendance report' });
  }
};

// Finance report — collections and outstanding balances
exports.financeReport = async (req, res) => {
  try {
    // Total collected
    const [collected] = await pool.query(
      'SELECT SUM(amount_paid) AS total_collected, COUNT(*) AS total_payments FROM fee_payments'
    );

    // Per student balance
    const [balances] = await pool.query(`
      SELECT 
        s.reg_number,
        s.full_name,
        p.name AS programme,
        COALESCE(fs.amount, 0) AS fee_required,
        COALESCE(SUM(fp.amount_paid), 0) AS total_paid,
        COALESCE(fs.amount, 0) - COALESCE(SUM(fp.amount_paid), 0) AS balance
      FROM students s
      LEFT JOIN programmes p ON s.programme_id = p.id
      LEFT JOIN fee_structures fs ON s.programme_id = fs.programme_id
      LEFT JOIN fee_payments fp ON s.id = fp.student_id
      GROUP BY s.id
      ORDER BY balance DESC
    `);

    const outstanding = balances.filter(b => b.balance > 0);
    const totalOutstanding = outstanding.reduce((sum, b) => sum + parseFloat(b.balance), 0);

    res.json({
      report_type: 'Finance Summary',
      generated_at: new Date().toISOString(),
      summary: {
        total_collected: collected[0].total_collected || 0,
        total_payments: collected[0].total_payments,
        total_outstanding: totalOutstanding,
        students_with_balance: outstanding.length,
      },
      balances,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating finance report' });
  }
};

// Academic results report — pass/fail per course
exports.academicReport = async (req, res) => {
  try {
    const [courseStats] = await pool.query(`
      SELECT 
        c.name AS course_name,
        c.code,
        COUNT(r.id) AS total_students,
        ROUND(AVG(r.score), 1) AS average_score,
        MAX(r.score) AS highest_score,
        MIN(r.score) AS lowest_score,
        SUM(CASE WHEN r.score >= 50 THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN r.score < 50 THEN 1 ELSE 0 END) AS failed,
        ROUND(
          (SUM(CASE WHEN r.score >= 50 THEN 1 ELSE 0 END) / COUNT(r.id)) * 100, 1
        ) AS pass_rate
      FROM courses c
      LEFT JOIN results r ON c.id = r.course_id
      GROUP BY c.id
      ORDER BY pass_rate ASC
    `);

    // Exam results stats
    const [examStats] = await pool.query(`
      SELECT 
        c.name AS course_name,
        c.code,
        es.exam_date,
        es.semester,
        COUNT(er.id) AS total_students,
        ROUND(AVG(er.score), 1) AS average_score,
        SUM(CASE WHEN er.score >= 50 THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN er.score < 50 THEN 1 ELSE 0 END) AS failed
      FROM exam_schedule es
      JOIN courses c ON es.course_id = c.id
      LEFT JOIN exam_results er ON es.id = er.exam_schedule_id
      GROUP BY es.id
      ORDER BY es.exam_date DESC
    `);

    res.json({
      report_type: 'Academic Results Summary',
      generated_at: new Date().toISOString(),
      continuous_assessment: courseStats,
      examination_results: examStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating academic report' });
  }
};

// Department report — HOD overview
exports.departmentReport = async (req, res) => {
  try {
    const [staffCount] = await pool.query(
      'SELECT COUNT(*) AS total FROM staff'
    );
    const [studentCount] = await pool.query(
      'SELECT COUNT(*) AS total FROM students'
    );
    const [courseCount] = await pool.query(
      'SELECT COUNT(*) AS total FROM courses'
    );
    const [programmeCount] = await pool.query(
      'SELECT COUNT(*) AS total FROM programmes'
    );

    // Students per programme
    const [byProgramme] = await pool.query(`
      SELECT p.name AS programme, COUNT(s.id) AS student_count
      FROM programmes p
      LEFT JOIN students s ON p.id = s.programme_id
      GROUP BY p.id
    `);

    res.json({
      report_type: 'Department Overview',
      generated_at: new Date().toISOString(),
      summary: {
        total_staff: staffCount[0].total,
        total_students: studentCount[0].total,
        total_courses: courseCount[0].total,
        total_programmes: programmeCount[0].total,
      },
      students_by_programme: byProgramme,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating department report' });
  }
};
