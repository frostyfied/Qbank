require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({
    message: 'QBank API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/users', userRoutes);
// quizRoutes handles both /quizzes/* and /quiz-attempts/* — mounted at /api
app.use('/api', quizRoutes);

// 404 + central error handler (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from .env');
    }
    await connectDB(); // do not listen until DB is up
    app.listen(PORT, () => {
      console.log(`QBank API running at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();