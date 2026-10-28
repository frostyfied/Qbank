const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Bookmark = require('../models/Bookmark'); // ADDED THIS

function buildVisibilityFilter(user) {
  if (user.role === 'admin' || user.role === 'teacher') {
    return { isDeleted: false };
  }
  return {
    isDeleted: false,
    $or: [
      { status: { $in: ['approved', 'published'] }, isPrivate: false },
      { authorId: user._id },
    ],
  };
}

async function listQuestions(req, res) {
  const {
    page = 1,
    limit = 10,
    search,
    subject,
    topic,
    semester,
    difficulty,
    type,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const filter = buildVisibilityFilter(req.user);

  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: [{ text: re }, { topic: re }, { tags: re }] });
  }
  if (subject) {
    if (/^[0-9a-fA-F]{24}$/.test(String(subject))) {
      filter.subjectId = subject;
    } else {
      filter.subjectName = new RegExp(`^${String(subject)}$`, 'i');
    }
  }
  if (topic) filter.topic = new RegExp(`^${topic}$`, 'i');
  if (semester) filter.semester = Number(semester);
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;

  const [total, questions] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  // FIX: Fetch user's bookmarks and attach isBookmarked flag
  const userBookmarks = await Bookmark.find({ userId: req.user._id }).select('questionId').lean();
  const bookmarkedIds = new Set(userBookmarks.map(b => String(b.questionId)));
  
  const questionsWithBookmarks = questions.map(q => ({
    ...q,
    isBookmarked: bookmarkedIds.has(String(q._id))
  }));

  res.json({
    questions: questionsWithBookmarks,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
}

async function getQuestion(req, res) {
  const q = await Question.findById(req.params.id).lean();
  if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });

  const isOwner = String(q.authorId) === String(req.user._id);
  const isStaff = ['teacher', 'admin'].includes(req.user.role);
  const isPublicVisible = ['approved', 'published'].includes(q.status) && !q.isPrivate;

  if (!isOwner && !isStaff && !isPublicVisible) {
    return res.status(403).json({ message: 'Not allowed to view this question' });
  }

  // FIX: Attach isBookmarked for the detail page too
  const bookmark = await Bookmark.findOne({ userId: req.user._id, questionId: q._id });
  
  res.json({ question: { ...q, isBookmarked: !!bookmark } });
}

async function createQuestion(req, res) {
  const body = req.body || {};
  const required = ['text', 'type', 'subjectId', 'semester', 'difficulty', 'marks'];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      return res.status(400).json({ message: `Field '${k}' is required` });
    }
  }

  const subjectDoc = await Subject.findById(body.subjectId);
  if (!subjectDoc) return res.status(400).json({ message: 'Invalid subjectId' });

  const isStaff = ['teacher', 'admin'].includes(req.user.role);

  let status;
  let isPrivate;
  if (isStaff) {
    status = 'published';
    isPrivate = Boolean(body.isPrivate);
  } else {
    isPrivate = Boolean(body.isPrivate);
    status = isPrivate ? 'approved' : 'pending';
  }

  const doc = await Question.create({
    text: body.text,
    type: body.type,
    subjectId: subjectDoc._id,
    subjectName: subjectDoc.name,
    topic: body.topic || '',
    semester: Number(body.semester),
    difficulty: body.difficulty,
    marks: Number(body.marks),
    tags: Array.isArray(body.tags) ? body.tags : [],
    explanation: body.explanation || '',
    options: Array.isArray(body.options) ? body.options : undefined,
    correctAnswer: body.correctAnswer,
    acceptedAnswers: Array.isArray(body.acceptedAnswers) ? body.acceptedAnswers : undefined,
    sampleCode: body.sampleCode,
    programmingLanguage: body.programmingLanguage,
    authorId: req.user._id,
    authorName: req.user.name,
    isPrivate,
    status,
  });

  res.status(201).json({ question: doc });
}

async function updateQuestion(req, res) {
  const q = await Question.findById(req.params.id);
  if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });

  const isStaff = ['teacher', 'admin'].includes(req.user.role);
  const isOwner = String(q.authorId) === String(req.user._id);

  if (!isStaff && !isOwner) {
    return res.status(403).json({ message: 'Not allowed to edit this question' });
  }
  if (!isStaff && q.status !== 'pending') {
    return res.status(403).json({ message: 'Only pending submissions can be edited by students' });
  }

  const editable = [
    'text', 'type', 'subjectId', 'topic', 'semester', 'difficulty', 'marks',
    'tags', 'explanation', 'options', 'correctAnswer', 'acceptedAnswers',
    'sampleCode', 'programmingLanguage', 'isPrivate',
  ];

  for (const key of editable) {
    if (req.body[key] !== undefined) {
      if (key === 'subjectId' && req.body[key] !== String(q.subjectId)) {
        const subj = await Subject.findById(req.body[key]);
        if (!subj) return res.status(400).json({ message: 'Invalid subjectId' });
        q.subjectName = subj.name;
      }
      q[key] = req.body[key];
    }
  }

  if (isStaff && req.body.status) {
    const allowed = ['pending', 'approved', 'rejected', 'published'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    q.status = req.body.status;
  }

  await q.save();
  res.json({ question: q });
}

async function deleteQuestion(req, res) {
  const q = await Question.findById(req.params.id);
  if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });
  q.isDeleted = true;
  await q.save();
  res.json({ message: 'Question deleted' });
}

async function listPending(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = { status: 'pending', isDeleted: false };
  const [total, questions] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter)
      .sort({ createdAt: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  res.json({
    questions,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
  });
}

async function reviewQuestion(req, res) {
  const { action, feedback } = req.body || {};
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
  }

  const q = await Question.findById(req.params.id);
  if (!q || q.isDeleted) return res.status(404).json({ message: 'Question not found' });
  if (q.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending questions can be reviewed' });
  }

  q.status = action === 'approve' ? 'approved' : 'rejected';
  q.reviewFeedback = feedback || '';
  q.reviewedBy = req.user._id;
  q.reviewedAt = new Date();
  await q.save();

  res.json({ question: q });
}

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listPending,
  reviewQuestion,
};