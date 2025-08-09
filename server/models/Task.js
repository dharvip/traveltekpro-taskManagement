const mongoose = require('mongoose');

const VALID_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_QA', 'READY_FOR_LIVE', 'DONE'];

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, minlength: 3, maxlength: 120 },
    description: { type: String, default: '', maxlength: 10000 },
    status: { type: String, enum: VALID_STATUSES, default: 'BACKLOG' },
    position: { type: Number, required: true },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, position: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, VALID_STATUSES };


