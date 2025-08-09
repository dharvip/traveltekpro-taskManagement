const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireToken } = require('../utils/requireToken');

// Public health check can be outside token
router.get('/health', (_req, res) => res.json({ ok: true }));

// Protect all routes below with token middleware (adjust as needed)
router.use(requireToken);

router.post('/tasks', taskController.createTask);
router.get('/tasks', taskController.listTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.patch('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.patch('/tasks/:id/move', taskController.moveTask);

module.exports = router;


