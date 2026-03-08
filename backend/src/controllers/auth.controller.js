const { z } = require('zod');
const authService = require('../services/auth.service');

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['parent', 'child']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({ message: 'Registration successful', user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id, req.token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

async function pair(req, res, next) {
  try {
    const { pairCode } = req.body;
    if (!pairCode) return res.status(400).json({ error: 'Pair code required' });
    const result = await authService.pairAccounts(req.user.id, pairCode.trim().toUpperCase());
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  const { id, name, email, role } = req.user;
  res.json({ id, name, email, role });
}

module.exports = { register, login, refresh, logout, pair, me };
