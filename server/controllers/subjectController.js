const Subject = require('../models/Subject');
const Question = require('../models/Question');

async function listSubjects(_req, res) {
  const subjects = await Subject.find().sort({ semester: 1, name: 1 }).lean();
  res.json(subjects);
}

async function createSubject(req, res) {
  const { name, code, semester, description, topics } = req.body || {};
  if (!name || !code || !semester) {
    return res.status(400).json({ message: 'name, code and semester are required' });
  }
  const semesterNum = Number(semester);
  if (!Number.isInteger(semesterNum) || semesterNum < 1 || semesterNum > 8) {
    return res.status(400).json({ message: 'semester must be between 1 and 8' });
  }

  const subject = await Subject.create({
    name: String(name).trim(),
    code: String(code).trim().toUpperCase(),
    semester: semesterNum,
    description: description || '',
    topics: Array.isArray(topics) ? topics : [],
  });
  res.status(201).json({ subject });
}

async function updateSubject(req, res) {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const { name, code, semester, description, topics } = req.body || {};
  if (name !== undefined) subject.name = String(name).trim();
  if (code !== undefined) subject.code = String(code).trim().toUpperCase();
  if (semester !== undefined) {
    const n = Number(semester);
    if (!Number.isInteger(n) || n < 1 || n > 8) {
      return res.status(400).json({ message: 'semester must be between 1 and 8' });
    }
    subject.semester = n;
  }
  if (description !== undefined) subject.description = description;
  if (Array.isArray(topics)) {
    const merged = new Set([...(subject.topics || []), ...topics]);
    subject.topics = Array.from(merged);
  }

  await subject.save();

  // Keep cached subjectName on questions in sync
  if (name !== undefined) {
    await Question.updateMany({ subjectId: subject._id }, { subjectName: subject.name });
  }

  res.json({ subject });
}

async function deleteSubject(req, res) {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  const usedByQuestions = await Question.exists({ subjectId: subject._id, isDeleted: false });
  if (usedByQuestions) {
    return res.status(409).json({ message: 'Cannot delete subject with existing questions' });
  }

  await subject.deleteOne();
  res.json({ message: 'Subject deleted' });
}

module.exports = { listSubjects, createSubject, updateSubject, deleteSubject };