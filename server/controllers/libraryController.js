const pool = require('../config/db');

// Add a book (librarian only)
exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn, total_copies } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const copies = total_copies || 1;

    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)',
      [title, author || null, isbn || null, copies, copies]
    );

    res.status(201).json({ message: 'Book added', bookId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding book' });
  }
};

// Get all books (everyone)
exports.getAllBooks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, author, isbn, total_copies, available_copies FROM books ORDER BY title'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching books' });
  }
};

// Issue a book (librarian only)
exports.issueBook = async (req, res) => {
  try {
    const { book_id, student_id, due_date } = req.body;

    if (!book_id || !student_id || !due_date) {
      return res.status(400).json({ message: 'book_id, student_id, and due_date are required' });
    }

    // Check availability
    const [book] = await pool.query(
      'SELECT available_copies FROM books WHERE id = ?', [book_id]
    );
    if (book.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book[0].available_copies < 1) {
      return res.status(400).json({ message: 'No copies available' });
    }

    const [staff] = await pool.query(
      'SELECT id FROM staff WHERE user_id = ?', [req.user.id]
    );

    const issued_date = new Date().toISOString().split('T')[0];

    await pool.query(
      'INSERT INTO book_loans (book_id, student_id, issued_date, due_date, issued_by) VALUES (?, ?, ?, ?, ?)',
      [book_id, student_id, issued_date, due_date, staff[0]?.id || null]
    );

    // Decrease available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]
    );

    res.status(201).json({ message: 'Book issued successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error issuing book' });
  }
};

// Return a book (librarian only)
exports.returnBook = async (req, res) => {
  try {
    const { loan_id } = req.body;

    if (!loan_id) {
      return res.status(400).json({ message: 'loan_id is required' });
    }

    const [loan] = await pool.query(
      'SELECT * FROM book_loans WHERE id = ? AND returned_date IS NULL', [loan_id]
    );
    if (loan.length === 0) {
      return res.status(404).json({ message: 'Active loan not found' });
    }

    const returned_date = new Date().toISOString().split('T')[0];

    await pool.query(
      'UPDATE book_loans SET returned_date = ? WHERE id = ?',
      [returned_date, loan_id]
    );

    // Increase available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [loan[0].book_id]
    );

    res.json({ message: 'Book returned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error returning book' });
  }
};

// Get active loans (librarian/hod)
exports.getActiveLoans = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT bl.id AS loan_id, bl.issued_date, bl.due_date,
             b.title, b.isbn,
             s.full_name AS student_name, s.reg_number
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      JOIN students s ON bl.student_id = s.id
      WHERE bl.returned_date IS NULL
      ORDER BY bl.due_date ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching loans' });
  }
};

// Get own loans (student)
exports.getMyLoans = async (req, res) => {
  try {
    const [student] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?', [req.user.id]
    );
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const [rows] = await pool.query(`
      SELECT bl.issued_date, bl.due_date, bl.returned_date,
             b.title, b.author
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      WHERE bl.student_id = ?
      ORDER BY bl.issued_date DESC
    `, [student[0].id]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching your loans' });
  }
};
