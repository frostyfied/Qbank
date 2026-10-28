const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/quizController');

router.use(authRequired);

// Student Quiz Routes
router.post('/quizzes/generate', requireRole('student', 'teacher', 'admin'), ctrl.generateQuiz);
router.get('/quizzes/:id', ctrl.getQuiz);
router.post('/quizzes/:id/submit', requireRole('student', 'teacher', 'admin'), ctrl.submitQuiz);

// Quiz History
router.get('/quiz-attempts', ctrl.listAttempts);

// NEW TEACHER ROUTES (Must be before /quiz-attempts/:id)
router.get('/quiz-attempts/pending', requireRole('teacher', 'admin'), ctrl.listPendingAttempts);
router.patch('/quiz-attempts/:id/grade', requireRole('teacher', 'admin'), ctrl.gradeAttempt);

// Attempt Details (Keep last so it doesn't swallow 'pending')
router.get('/quiz-attempts/:id', ctrl.getAttempt);

module.exports = router;