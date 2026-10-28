const Question = require('../models/Question');
const Subject = require('../models/Subject');
const QuizAttempt = require('../models/QuizAttempt');
const { gradeAuto } = require('../utils/grading');

function stripAnswerKey(q) {
  return {
    _id: q._id, text: q.text, type: q.type, marks: q.marks, options: q.options,
    topic: q.topic, difficulty: q.difficulty, subjectName: q.subjectName,
    sampleCode: q.sampleCode, programmingLanguage: q.programmingLanguage,
  };
}

async function generateQuiz(req, res) {
  // ... (keep existing logic)
  const { subjectId, topic, difficulty, count, type, timeLimit } = req.body || {};
  const countNum = Math.min(50, Math.max(1, parseInt(count, 10) || 10));

  const match = { isDeleted: false, status: { $in: ['approved', 'published'] }, isPrivate: false };
  if (subjectId) match.subjectId = subjectId;
  if (topic) match.topic = new RegExp(`^${topic}$`, 'i');
  if (difficulty && difficulty !== 'all') match.difficulty = difficulty;
  if (type) match.type = type;

  let subjectName = null;
  if (subjectId) {
    const subj = await Subject.findById(subjectId).lean();
    subjectName = subj?.name || null;
  }

  const questions = await Question.aggregate([{ $match: match }, { $sample: { size: countNum } }]);

  if (questions.length === 0) return res.status(400).json({ message: 'No questions match the selected criteria' });

  const attempt = await QuizAttempt.create({
    userId: req.user._id, subjectId: subjectId || undefined, subjectName: subjectName || undefined,
    topic: topic || undefined, difficulty: difficulty || 'all', totalQuestions: questions.length,
    timeLimitMinutes: timeLimit ? Number(timeLimit) : null, status: 'in_progress',
    overallGradingStatus: 'in_progress',
    questions: questions.map((q) => ({
      questionId: q._id, text: q.text, type: q.type, marks: q.marks, options: q.options,
      correctAnswer: q.correctAnswer, acceptedAnswers: q.acceptedAnswers, explanation: q.explanation,
      gradingStatus: 'pending_review', awardedMarks: 0,
      subjectName: q.subjectName, topic: q.topic, difficulty: q.difficulty,
    })),
  });

  res.status(201).json({
    quizId: attempt._id, subjectName, totalQuestions: attempt.totalQuestions,
    timeLimitMinutes: attempt.timeLimitMinutes, questions: questions.map(stripAnswerKey),
  });
}

async function getQuiz(req, res) {
  const attempt = await QuizAttempt.findById(req.params.id).lean();
  if (!attempt) return res.status(404).json({ message: 'Quiz not found' });
  if (String(attempt.userId) !== String(req.user._id) && req.user.role === 'student') return res.status(403).json({ message: 'Not allowed' });

  const submitted = attempt.status === 'submitted';
  const questions = attempt.questions.map((q) => submitted ? { ...q, _id: q.questionId } : stripAnswerKey({ ...q, _id: q.questionId }));

  res.json({ id: attempt._id, timeLimitMinutes: attempt.timeLimitMinutes, questions });
}

async function submitQuiz(req, res) {
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) return res.status(404).json({ message: 'Quiz not found' });
  if (String(attempt.userId) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
  if (attempt.status === 'submitted') return res.status(409).json({ message: 'Already submitted' });

  const { answers = [], durationSeconds = 0 } = req.body || {};
  const answerMap = new Map(answers.map((a) => [String(a.questionId), a.userAnswer]));

  let hasPendingManual = false;
  let score = 0, maxScore = 0;

  for (const snap of attempt.questions) {
    maxScore += Number(snap.marks) || 0;
    if (answerMap.has(String(snap.questionId))) snap.userAnswer = answerMap.get(String(snap.questionId));

    const result = gradeAuto({ type: snap.type, correctAnswer: snap.correctAnswer, acceptedAnswers: snap.acceptedAnswers, marks: snap.marks }, snap.userAnswer);
    snap.gradingStatus = result.gradingStatus;

    if (result.gradingStatus === 'auto_graded') {
      snap.isCorrect = result.isCorrect;
      snap.awardedMarks = result.awardedMarks;
      score += result.awardedMarks;
    } else {
      hasPendingManual = true;
      snap.awardedMarks = 0;
    }
  }

  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
  attempt.durationSecondsTaken = Number(durationSeconds) || 0;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  attempt.overallGradingStatus = hasPendingManual ? 'pending_manual_grading' : 'completed';

  await attempt.save();
  res.json({ attempt: attempt.toObject() });
}

async function listAttempts(req, res) {
  const attempts = await QuizAttempt.find({ userId: req.user._id, status: 'submitted' }).select('-questions').sort({ submittedAt: -1 }).lean();
  res.json({ attempts });
}

async function getAttempt(req, res) {
  const attempt = await QuizAttempt.findById(req.params.id).lean();
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  const isOwner = String(attempt.userId) === String(req.user._id);
  if (!isOwner && req.user.role === 'student') return res.status(403).json({ message: 'Not allowed' });
  res.json({ attempt });
}

// --- TEACHER REVIEW FUNCTIONS ---

async function listPendingAttempts(req, res) {
  const filter = { status: 'submitted', isReviewedByTeacher: false };
  const attempts = await QuizAttempt.find(filter)
    .populate('userId', 'name email')
    .sort({ submittedAt: -1 })
    .lean();
  res.json({ attempts });
}

async function gradeAttempt(req, res) {
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  
  const { grades } = req.body; // Expecting an array of { questionId, awardedMarks, teacherComment }

  if (grades && Array.isArray(grades)) {
    for (const grade of grades) {
      const q = attempt.questions.find(sq => String(sq.questionId) === String(grade.questionId));
      if (q) {
        q.awardedMarks = Number(grade.awardedMarks) || 0;
        q.teacherComment = grade.teacherComment || '';
        q.gradingStatus = 'manual_graded';
        q.isCorrect = q.awardedMarks >= q.marks; // Simple logic: full marks = correct
      }
    }
  }

  // Recalculate total score
  let newScore = 0;
  let hasPendingManual = false;
  
  for (const q of attempt.questions) {
    newScore += q.awardedMarks || 0;
    if (q.gradingStatus === 'pending_review') hasPendingManual = true;
  }

  attempt.score = newScore;
  attempt.percentage = attempt.maxScore > 0 ? Number(((newScore / attempt.maxScore) * 100).toFixed(2)) : 0;
  
  if (!hasPendingManual) {
    attempt.overallGradingStatus = 'completed';
    attempt.isReviewedByTeacher = true; // Vanishes from list
  }

  await attempt.save();
  res.json({ attempt });
}

module.exports = { generateQuiz, getQuiz, submitQuiz, listAttempts, getAttempt, listPendingAttempts, gradeAttempt };