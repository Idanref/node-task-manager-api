const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/task');

// Create a task
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Update a task by id
router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    // NOTE: same note here like on routers/user.js, to access middleware
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    return res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get all tasks
// GET /tasks?completed=false
// Pagination: GET /tasks?limit=10&skip=20
// Get /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    // in sort: asc = 1, desc = -1
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }
  try {
    // [populate() lets you reference documents in other collections]
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);

    // Another Option To Find Tasks:
    // const tasks = await Task.find({ owner: req.user._id });
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get task by id
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Delete a task

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).send({ error: 'Task not found!' });
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
