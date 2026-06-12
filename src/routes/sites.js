const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getStorage } = require('../storage');
const auth = require('../auth');

const router = express.Router();

function publicSite(site) {
  if (!site) return null;
  const { clientPasswordHash, ...rest } = site;
  return { ...rest, hasClientPassword: !!clientPasswordHash };
}

// List sites: owner sees everything, a client sees only their own site.
router.get('/', auth.requireAuth, async (req, res) => {
  const storage = await getStorage();
  if (req.user.role === 'owner') {
    const sites = await storage.listSites();
    return res.json(sites.map(publicSite));
  }
  const site = await storage.getSite(req.user.siteId);
  return res.json(site ? [publicSite(site)] : []);
});

// Create a new site (owner only).
router.post('/', auth.requireOwner, async (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  const storage = await getStorage();
  const site = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    clientPasswordHash: null,
    publish: {},
  };
  await storage.createSite(site);
  res.status(201).json(publicSite(site));
});

router.get('/:siteId', auth.requireSiteAccess, async (req, res) => {
  const storage = await getStorage();
  const site = await storage.getSite(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json(publicSite(site));
});

// Update site settings: name, client password, publish target (owner only).
router.patch('/:siteId', auth.requireOwner, async (req, res) => {
  const storage = await getStorage();
  const site = await storage.getSite(req.params.siteId);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const patch = {};
  if (typeof req.body.name === 'string') patch.name = req.body.name;
  if (typeof req.body.clientPassword === 'string' && req.body.clientPassword) {
    patch.clientPasswordHash = await auth.hashPassword(req.body.clientPassword);
  }
  if (req.body.publish && typeof req.body.publish === 'object') {
    patch.publish = { ...site.publish, ...req.body.publish };
  }

  const updated = await storage.updateSite(req.params.siteId, patch);
  res.json(publicSite(updated));
});

router.delete('/:siteId', auth.requireOwner, async (req, res) => {
  const storage = await getStorage();
  await storage.deleteSite(req.params.siteId);
  res.json({ ok: true });
});

module.exports = router;
