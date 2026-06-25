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
