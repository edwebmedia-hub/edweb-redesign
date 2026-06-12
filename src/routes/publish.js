const express = require('express');
const { getStorage } = require('../storage');
const { publishSite } = require('../publish');
const auth = require('../auth');

const router = express.Router({ mergeParams: true });

router.use(auth.requireSiteAccess);

// Render every page's current content into a static bundle, store an
// immutable snapshot, and (if configured) deploy it.
router.post('/', async (req, res) => {
  try {
    const publish = await publishSite(req.params.siteId);
    res.status(201).json(publish);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const storage = await getStorage();
  const publishes = await storage.listPublishes(req.params.siteId);
  res.json(publishes);
});

router.get('/:publishId', async (req, res) => {
  const storage = await getStorage();
  const publish = await storage.getPublish(req.params.siteId, req.params.publishId);
  if (!publish) return res.status(404).json({ error: 'Publish not found' });
  res.json(publish);
});

router.get('/:publishId/files', async (req, res) => {
  const storage = await getStorage();
  const publish = await storage.getPublish(req.params.siteId, req.params.publishId);
  if (!publish) return res.status(404).json({ error: 'Publish not found' });
  const files = await storage.getPublishFiles(req.params.siteId, req.params.publishId);
  res.json(files);
});

module.exports = router;
