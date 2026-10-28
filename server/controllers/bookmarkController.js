const Bookmark = require('../models/Bookmark');
const Question = require('../models/Question');

async function listBookmarks(req, res) {
  const bookmarks = await Bookmark.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  const questionIds = bookmarks.map((b) => b.questionId);
  const questions = await Question.find({
    _id: { $in: questionIds },
    isDeleted: false,
  }).lean();

  const byId = new Map(questions.map((q) => [String(q._id), q]));
  
  const items = bookmarks
    .map((b) => {
      const q = byId.get(String(b.questionId));
      // Attach isBookmarked: true so the frontend renders the golden icon
      return q ? { _id: b._id, createdAt: b.createdAt, question: { ...q, isBookmarked: true } } : null;
    })
    .filter(Boolean);

  res.json({ bookmarks: items });
}

async function addBookmark(req, res) {
  const { questionId } = req.params;
  const question = await Question.findById(questionId).lean();
  if (!question || question.isDeleted) {
    return res.status(404).json({ message: 'Question not found' });
  }

  try {
    await Bookmark.create({ userId: req.user._id, questionId });
    res.status(201).json({ message: 'Bookmarked' });
  } catch (err) {
    if (err.code === 11000) return res.json({ message: 'Already bookmarked' });
    throw err;
  }
}

async function removeBookmark(req, res) {
  const { questionId } = req.params;
  await Bookmark.deleteOne({ userId: req.user._id, questionId });
  res.json({ message: 'Bookmark removed' });
}

module.exports = { listBookmarks, addBookmark, removeBookmark };