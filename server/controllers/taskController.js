const { v4: uuidv4 } = require('uuid');
const { Task, VALID_STATUSES } = require('../models/Task');

function validateTaskInput(payload, isCreate = false) {
  const errors = [];
  if (payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length < 3 || payload.title.trim().length > 120) {
      errors.push('Title must be 3–120 characters.');
    }
  } else if (isCreate) {
    errors.push('Title is required.');
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== 'string' || payload.description.length > 10000) {
      errors.push('Description must be ≤ 10,000 characters.');
    }
  }

  if (payload.status !== undefined) {
    if (!VALID_STATUSES.includes(payload.status)) {
      errors.push('Invalid status.');
    }
  }

  if (payload.position !== undefined) {
    if (typeof payload.position !== 'number' || !Number.isFinite(payload.position)) {
      errors.push('Position must be a number.');
    }
  }

  return errors;
}

async function getNextPosition(status) {
  const last = await Task.findOne({ status }).sort({ position: -1 }).lean();
  const maxPos = last?.position ?? 0;
  return maxPos + 1000;
}

// CRUD Handlers
exports.createTask = async (req, res) => {
  try {
    const errors = validateTaskInput(req.body, true);
    if (errors.length) return res.status(400).json({ errors });
    const { title, description = '' } = req.body;
    const position = await getNextPosition('BACKLOG');
    const task = await Task.create({ id: uuidv4(), title: title.trim(), description, status: 'BACKLOG', position });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listTasks = async (_req, res) => {
  try {
    const tasks = await Task.find({}).sort({ position: 1 }).lean();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id }).lean();
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const errors = validateTaskInput(req.body, false);
    if (errors.length) return res.status(400).json({ errors });

    const update = {};
    if (req.body.title !== undefined) update.title = req.body.title.trim();
    if (req.body.description !== undefined) update.description = req.body.description;
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.position !== undefined) update.position = req.body.position;

    const task = await Task.findOneAndUpdate({ id: req.params.id }, update, { new: true });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { toStatus, toPosition } = req.body;
    const errors = [];
    if (!VALID_STATUSES.includes(toStatus)) errors.push('Invalid toStatus');
    if (typeof toPosition !== 'number' || !Number.isFinite(toPosition)) errors.push('Invalid toPosition');
    if (errors.length) return res.status(400).json({ errors });

    const task = await Task.findOneAndUpdate(
      { id: req.params.id },
      { status: toStatus, position: toPosition },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


