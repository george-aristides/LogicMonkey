import './index.css';

const router = require('./router');
const dashboard = require('./views/dashboard');
const quiz = require('./views/quiz');
const results = require('./views/results');

router.register('#dashboard', dashboard);
router.register('#quiz', quiz);
router.register('#results', results);

router.init(document.getElementById('app'));
