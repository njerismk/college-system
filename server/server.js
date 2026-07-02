const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'College Management System API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const authRoutes = require('./routes/authRoutes');
// ...after app.use(express.json());
app.use('/api/auth', authRoutes);

const studentRoutes = require('./routes/studentRoutes');
// after app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

const staffRoutes = require('./routes/staffRoutes');
// after app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);

const timetableRoutes = require('./routes/timetableRoutes');
// after app.use('/api/staff', staffRoutes);
app.use('/api/timetable', timetableRoutes);

const courseRoutes = require('./routes/courseRoutes');
// after app.use('/api/timetable', timetableRoutes);
app.use('/api/courses', courseRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

const resultsRoutes = require('./routes/resultsRoutes');
app.use('/api/results', resultsRoutes);

const communicationRoutes = require('./routes/communicationRoutes');
app.use('/api/messages', communicationRoutes);

const financeRoutes = require('./routes/financeRoutes');
app.use('/api/finance', financeRoutes);

const libraryRoutes = require('./routes/libraryRoutes');
app.use('/api/library', libraryRoutes);

const examinationRoutes = require('./routes/examinationRoutes');
app.use('/api/examination', examinationRoutes);

const reportsRoutes = require('./routes/reportsRoutes');
app.use('/api/reports', reportsRoutes);
