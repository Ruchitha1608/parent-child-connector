const cron = require('node-cron');
const { prisma } = require('../config/database');
const { getIo } = require('../sockets');

async function createReminder(createdById, { targetId, title, body, remindAt }) {
  return prisma.reminder.create({
    data: { createdById, targetId, title, body, remindAt: new Date(remindAt) },
  });
}

async function getReminders(userId) {
  return prisma.reminder.findMany({
    where: {
      OR: [{ createdById: userId }, { targetId: userId }],
    },
    orderBy: { remindAt: 'asc' },
  });
}

async function deleteReminder(id, createdById) {
  return prisma.reminder.delete({ where: { id, createdById } });
}

function startReminderCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const pending = await prisma.reminder.findMany({
        where: { isSent: false, remindAt: { lte: new Date() } },
      });

      if (!pending.length) return;

      const io = getIo();

      for (const reminder of pending) {
        io.to(`user:${reminder.targetId}`).emit('reminder:fire', {
          reminderId: reminder.id,
          title: reminder.title,
          body: reminder.body,
          remindAt: reminder.remindAt,
        });

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { isSent: true },
        });
      }
    } catch (err) {
      console.error('[Cron] Reminder error:', err.message);
    }
  });

  console.log('[Cron] Reminder scheduler started');

  // Every 5 minutes: check for stale child locations
  cron.schedule('*/5 * * * *', async () => {
    try {
      const io = getIo();
      const parents = await prisma.user.findMany({
        where: { role: 'parent', pairedWith: { not: null } },
        select: { id: true, pairedWith: true, pairedByUser: { select: { id: true, name: true } } },
      });
      const cutoff = new Date(Date.now() - 15 * 60 * 1000);
      for (const parent of parents) {
        if (!parent.pairedWith) continue;
        const lastLoc = await prisma.locationHistory.findFirst({
          where: { userId: parent.pairedWith },
          orderBy: { recordedAt: 'desc' },
        });
        if (lastLoc && lastLoc.recordedAt < cutoff) {
          io.to('user:' + parent.id).emit('alert:incoming', {
            alertType: 'custom',
            message: (parent.pairedByUser[0]?.name || 'Child') + ' has not shared location for 15+ minutes',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) { console.error('[Cron] Stale location check error:', err.message); }
  });
}

module.exports = { createReminder, getReminders, deleteReminder, startReminderCron };
