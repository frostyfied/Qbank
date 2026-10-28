const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/bookmarkController');

router.use(authRequired);

router.get('/', ctrl.listBookmarks);
router.post('/:questionId', ctrl.addBookmark);
router.delete('/:questionId', ctrl.removeBookmark);

module.exports = router;