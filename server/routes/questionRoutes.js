const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/questionController');

router.use(authRequired);

router.get('/pending', requireRole('teacher', 'admin'), ctrl.listPending);
router.get('/', ctrl.listQuestions);
router.get('/:id', ctrl.getQuestion);
router.post('/', requireRole('student', 'teacher', 'admin'), ctrl.createQuestion);
router.patch('/:id', ctrl.updateQuestion);
router.delete('/:id', requireRole('teacher', 'admin'), ctrl.deleteQuestion);
router.post('/:id/review', requireRole('teacher', 'admin'), ctrl.reviewQuestion);

module.exports = router;