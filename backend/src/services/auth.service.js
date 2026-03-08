const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const { getRedis } = require('../config/redis');

const SALT_ROUNDS = 12;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

async function register({ name, email, phone, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const pairCode = role === 'child' ? uuidv4().split('-')[0].toUpperCase() : null;

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role, pairCode },
    select: { id: true, name: true, email: true, phone: true, role: true, pairCode: true, createdAt: true },
  });

  return user;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in Redis (7 days)
  const redis = getRedis();
  await redis.setex(`rt:${user.id}`, 7 * 24 * 3600, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pairedWith: user.pairedWith,
      avatarUrl: user.avatarUrl,
      pairCode: user.pairCode,
    },
  };
}

async function refreshTokens(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const redis = getRedis();
  const stored = await redis.get(`rt:${decoded.id}`);
  if (stored !== token) {
    const err = new Error('Refresh token reuse detected');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await redis.setex(`rt:${user.id}`, 7 * 24 * 3600, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(userId, accessToken) {
  const redis = getRedis();
  // Blacklist access token (15 min TTL matches JWT expiry)
  await redis.setex(`bl:${accessToken}`, 15 * 60, '1');
  // Remove refresh token
  await redis.del(`rt:${userId}`);
}

async function pairAccounts(parentId, pairCode) {
  const child = await prisma.user.findUnique({ where: { pairCode } });
  if (!child) {
    const err = new Error('Invalid pair code');
    err.status = 404;
    throw err;
  }
  if (child.role !== 'child') {
    const err = new Error('Pair code does not belong to a child account');
    err.status = 400;
    throw err;
  }
  if (child.pairedWith) {
    const err = new Error('Child account is already paired');
    err.status = 409;
    throw err;
  }

  await prisma.user.update({
    where: { id: child.id },
    data: { pairedWith: parentId, pairCode: null },
  });

  return { message: 'Accounts paired successfully', childId: child.id, childName: child.name };
}

module.exports = { register, login, refreshTokens, logout, pairAccounts };
