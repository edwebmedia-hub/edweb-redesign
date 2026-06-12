const express = require('express');
const config = require('../config');
const { getStorage } = require('../storage');
const auth = require('../auth');

const router = express.Router();

// Owner login (master key) or per-site client login (siteId + password).
router.post('/login', async (req, res) => {
  const { key, siteId, password } = req.body || {};

  if (key) {
    if (key !== config.ownerMasterKey) {
      return res.status(401).json({ error: 'Invalid master key' });
    }
    const token = auth.signToken({ role: 'owner' });
    auth.setAuthCookie(res, token);
    return res.json({ role: 'owner' });
  }

  if (siteId && password) {
    const storage = await getStorage();
    const site = await storage.getSite(siteId);
    if (!site) return res.status(401).json({ error: 'Invalid site or password' });
    const ok = await auth.comparePassword(password, site.clientPasswordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid site or password' });
    const token = auth.signToken({ role: 'client', siteId });
    auth.setAuthCookie(res, token);
    return res.json({ role: 'client', siteId });
  }

  return res.status(400).json({ error: 'Provide either a master key or siteId + password' });
});

router.post('/logout', (req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.json({ authenticated: false });
  res.json({ authenticated: true, role: req.user.role, siteId: req.user.siteId || null });
});

module.exports = router;
