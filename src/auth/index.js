const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

const COOKIE_NAME = 'cms_token';
const TOKEN_TTL = '12h';

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

/** Reads the token from cookie or Authorization header and attaches req.user. */
function authenticate(req, _res, next) {
  let token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice('Bearer '.length);
  }
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

/** Owner can access any site; a client can only access their own site. */
function requireSiteAccess(req, res, next) {
  const siteId = req.params.siteId;
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role === 'owner') return next();
  if (req.user.role === 'client' && req.user.siteId === siteId) return next();
  return res.status(403).json({ error: 'You do not have access to this site' });
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  authenticate,
  requireAuth,
  requireOwner,
  requireSiteAccess,
  hashPassword,
  comparePassword,
};
