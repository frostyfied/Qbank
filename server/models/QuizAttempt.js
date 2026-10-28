const mongoose = require('mongoose');

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    text: String,
    type: String,
    marks: Number,
    options: [String],
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    acceptedAnswers: [String],
    explanation: String,
    isCorrect: Boolean,
    awardedMarks: { type: Number, default: 0 },
    gradingStatus: {
      type: String,
      enum: ['auto_graded', 'pending_review', 'manual_graded'],
      default: 'pending_review',
    },
    teacherComment: { type: String, default: '' },
    subjectName: String,
    topic: String,
    difficulty: String,
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: String,
    topic: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'all'] },
    totalQuestions: { type: Number, required: true },
    timeLimitMinutes: { type: Number, default: null },
    durationSecondsTaken: { type: Number, default: 0 },

    questions: [questionSnapshotSchema],

    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    overallGradingStatus: {
      type: String,
      enum: ['in_progress', 'completed', 'pending_manual_grading'],
      default: 'in_progress',
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted'],
      default: 'in_progress',
      index: true,
    },
    submittedAt: { type: Date, default: null },
    // NEW FIELD: Tracks if the teacher has checked off the review
    isReviewedByTeacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizAttempt', attemptSchema);