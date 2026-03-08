const { prisma } = require('../config/database');
const { getIo } = require('../sockets');

async function requestVerification(req, res, next) {
  try {
    const parentId = req.user.id;
    const child = await prisma.user.findFirst({
      where: { pairedWith: parentId, role: 'child' },
      select: { id: true, name: true },
    });
    if (!child) return res.status(404).json({ error: 'No paired child found' });

    const session = await prisma.videoVerification.create({
      data: { childId: child.id, parentId, sessionStatus: 'requested' },
    });

    const io = getIo();
    io.to(`user:${child.id}`).emit('video:request', {
      sessionId: session.id,
      parentId,
      requestedAt: session.requestedAt,
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function respondToRequest(req, res, next) {
  try {
    const { sessionId, accept } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = await prisma.videoVerification.update({
      where: { id: sessionId, childId: req.user.id },
      data: { sessionStatus: accept ? 'accepted' : 'declined' },
    });

    const io = getIo();
    io.to(`user:${session.parentId}`).emit('video:response', {
      sessionId,
      accepted: accept,
      childId: req.user.id,
    });

    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function completeSession(req, res, next) {
  try {
    const { sessionId, snapshotUrl } = req.body;
    const session = await prisma.videoVerification.update({
      where: { id: sessionId },
      data: { sessionStatus: 'completed', snapshotUrl, completedAt: new Date() },
    });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const parentId = req.user.id;
    const sessions = await prisma.videoVerification.findMany({
      where: { parentId },
      include: { child: { select: { id: true, name: true } } },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

async function submitSelfie(req, res, next) {
  try {
    if (req.user.role !== 'child') return res.status(403).json({ error: 'Children only' });
    const { snapshotUrl } = req.body;
    if (!snapshotUrl) return res.status(400).json({ error: 'snapshotUrl required' });
    const child = await prisma.user.findUnique({ where: { id: req.user.id }, select: { pairedWith: true, name: true } });
    if (!child?.pairedWith) return res.status(400).json({ error: 'Not paired' });
    const session = await prisma.videoVerification.create({
      data: { childId: req.user.id, parentId: child.pairedWith, snapshotUrl, sessionStatus: 'completed', completedAt: new Date() },
    });
    const io = getIo();
    io.to('user:' + child.pairedWith).emit('video:selfie', { sessionId: session.id, snapshotUrl, childId: req.user.id, childName: child.name, completedAt: session.completedAt });
    res.status(201).json(session);
  } catch (err) { next(err); }
}

async function getChildHistory(req, res, next) {
  try {
    const sessions = await prisma.videoVerification.findMany({
      where: { childId: req.user.id },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });
    res.json(sessions);
  } catch (err) { next(err); }
}

module.exports = { requestVerification, respondToRequest, completeSession, getHistory, submitSelfie, getChildHistory };
