const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/userController');

router.use(authRequired, requireRole('admin'));

router.get('/', ctrl.listUsers);
router.patch('/:id/role', ctrl.updateRole);

module.exports = router;