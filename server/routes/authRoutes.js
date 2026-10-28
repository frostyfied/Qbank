const router = require('express').Router();
const { authRequired } = require('../middleware/authMiddleware');
const { register, login, logout, me } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authRequired, me);

module.exports = router;