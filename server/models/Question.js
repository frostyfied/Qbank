const mongoose = require('mongoose');

const QUESTION_TYPES = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'long_answer', 'programming'];

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String, required: true },
    topic: { type: String, default: '', trim: true },
    semester: { type: Number, min: 1, max: 8, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    marks: { type: Number, required: true, min: 0 },
    tags: [{ type: String, trim: true }],
    explanation: { type: String, default: '' },

    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    acceptedAnswers: [{ type: String }],
    sampleCode: { type: String },
    programmingLanguage: { type: String },

    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'published'],
      default: 'pending',
    },
    reviewFeedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionSchema.index({ text: 'text', tags: 'text', topic: 'text' });
questionSchema.index({ subjectId: 1, difficulty: 1, type: 1 });

module.exports = mongoose.model('Question', questionSchema);
module.exports.QUESTION_TYPES = QUESTION_TYPES;