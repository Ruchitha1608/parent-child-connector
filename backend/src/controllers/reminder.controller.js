const reminderService = require('../services/reminder.service');
const { prisma } = require('../config/database');

async function create(req, res, next) {
  try {
    const { targetId, title, body, remindAt } = req.body;
    if (!targetId || !title || !remindAt) {
      return res.status(400).json({ error: 'targetId, title, remindAt required' });
    }
    // Verify target is their paired child
    const child = await prisma.user.findFirst({ where: { id: targetId, pairedWith: req.user.id } });
    if (!child) return res.status(403).json({ error: 'Not authorized for this child' });

    const reminder = await reminderService.createReminder(req.user.id, { targetId, title, body, remindAt });
    res.status(201).json(reminder);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const reminders = await reminderService.getReminders(req.user.id);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await reminderService.deleteReminder(req.params.id, req.user.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, remove };
