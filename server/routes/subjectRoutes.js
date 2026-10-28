const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/subjectController');

router.use(authRequired);

router.get('/', ctrl.listSubjects);
router.post('/', requireRole('admin'), ctrl.createSubject);
router.patch('/:id', requireRole('admin'), ctrl.updateSubject);
router.delete('/:id', requireRole('admin'), ctrl.deleteSubject);

module.exports = router;