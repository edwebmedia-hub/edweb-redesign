const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getStorage } = require('../storage');
const { ingestUrl } = require('../ingest');
const { runGuardian } = require('../guardian');
const { renderPage } = require('../render');
const { proposeChange } = require('../ai');
const { getCurrentContent } = require('../util/content');
const auth = require('../auth');

const router = express.Router({ mergeParams: true });

router.use(auth.requireSiteAccess);

function publicPage(page) {
  if (!page) return null;
  return {
    id: page.id,
    siteId: page.siteId,
    slug: page.slug,
    name: page.name,
    sourceUrl: page.sourceUrl,
    slots: page.slots,
    structure: page.template.structure,
    currentVersionId: page.currentVersionId,
    createdAt: page.createdAt,
  };
}

// ---- List pages ----
router.get('/', async (req, res) => {
  const storage = await getStorage();
  const pages = await storage.listPages(req.params.siteId);
  res.json(pages.map(publicPage));
});

// ---- Ingest a new page from a URL ----
router.post('/ingest', async (req, res) => {
  const { url, slug, name } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let result;
  try {
    result = await ingestUrl(url);
  } catch (err) {
    return res.status(502).json({ error: `Ingest failed: ${err.message}` });
  }

  const storage = await getStorage();
  const pageId = uuidv4();
  const page = {
    id: pageId,
    siteId: req.params.siteId,
    slug: typeof slug === 'string' ? slug.replace(/^\/+|\/+$/g, '') : '',
    name: name || url,
    sourceUrl: result.sourceUrl,
    template: result.template,
    slots: result.slots,
    currentVersionId: null,
    createdAt: new Date().toISOString(),
  };

  const version = {
    id: uuidv4(),
    pageId,
    version: 1,
    createdAt: new Date().toISOString(),
    author: req.user.role === 'owner' ? 'owner' : `client:${req.user.siteId}`,
    message: 'Initial ingest',
    content: result.content,
  };

  page.currentVersionId = version.id;

  await storage.createPage(page);
  await storage.addVersion(req.params.siteId, pageId, version);

  res.status(201).json(publicPage(page));
});

// ---- Get a single page ----
router.get('/:pageId', async (req, res) => {
  const storage = await getStorage();
  const page = await storage.getPage(req.params.siteId, req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  const content = await getCurrentContent(storage, req.params.siteId, req.params.pageId);
  res.json({ ...publicPage(page), content });
});

router.delete('/:pageId', auth.requireOwner, async (req, res) => {
  const storage = await getStorage();
  await storage.deletePage(req.params.siteId, req.params.pageId);
  res.json({ ok: true });
});

// ---- Live preview rendering ----
router.get('/:pageId/render', async (req, res) => {
  const storage = await getStorage();
  const page = await storage.getPage(req.params.siteId, req.params.pageId);
  if (!page) return res.status(404).send('Page not found');
  const content = await getCurrentContent(storage, req.params.siteId, req.params.pageId);
  const editable = req.query.editable !== 'false';
  const html = renderPage(page.template, content, { stripSlotAttrs: !editable });
  res.set('Content-Type', 'text/html').send(html);
});

// ---- Content versions ----
router.get('/:pageId/versions', async (req, res) => {
  const storage = await getStorage();
  const versions = await storage.listVersions(req.params.siteId, req.params.pageId);
  res.json(versions.map(({ content, ...meta }) => meta));
});

router.get('/:pageId/versions/:versionId', async (req, res) => {
  const storage = await getStorage();
  const version = await storage.getVersion(req.params.siteId, req.params.pageId, req.params.versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json(version);
});

// ---- Apply a content change (validated by the Guardian) ----
router.post('/:pageId/content', async (req, res) => {
  const { changes, message } = req.body || {};
  const storage = await getStorage();
  const page = await storage.getPage(req.params.siteId, req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  const currentContent = await getCurrentContent(storage, req.params.siteId, req.params.pageId);
  const result = runGuardian(page, currentContent, changes);
  if (!result.ok) {
    return res.status(422).json({ ok: false, errors: result.errors });
  }

  const versions = await storage.listVersions(req.params.siteId, req.params.pageId);
  const nextVersionNumber = versions.length > 0 ? versions[versions.length - 1].version + 1 : 1;

  const version = {
    id: uuidv4(),
    pageId: page.id,
    version: nextVersionNumber,
    createdAt: new Date().toISOString(),
    author: req.user.role === 'owner' ? 'owner' : `client:${req.user.siteId}`,
    message: message || 'Content update',
    content: result.content,
  };

  await storage.addVersion(req.params.siteId, page.id, version);
  await storage.updatePage(req.params.siteId, page.id, { currentVersionId: version.id });

  res.json({ ok: true, version: { ...version, content: undefined }, content: result.content });
});

// ---- Rollback to a previous version (creates a new version copying its content) ----
router.post('/:pageId/versions/:versionId/rollback', async (req, res) => {
  const storage = await getStorage();
  const page = await storage.getPage(req.params.siteId, req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  const target = await storage.getVersion(req.params.siteId, req.params.pageId, req.params.versionId);
  if (!target) return res.status(404).json({ error: 'Version not found' });

  const versions = await storage.listVersions(req.params.siteId, req.params.pageId);
  const nextVersionNumber = versions.length > 0 ? versions[versions.length - 1].version + 1 : 1;

  const version = {
    id: uuidv4(),
    pageId: page.id,
    version: nextVersionNumber,
    createdAt: new Date().toISOString(),
    author: req.user.role === 'owner' ? 'owner' : `client:${req.user.siteId}`,
    message: `Rollback to v${target.version}`,
    content: target.content,
  };

  await storage.addVersion(req.params.siteId, page.id, version);
  await storage.updatePage(req.params.siteId, page.id, { currentVersionId: version.id });

  res.json({ ok: true, version: { ...version, content: undefined }, content: version.content });
});

// ---- AI chat: plain English -> structured change -> Guardian -> apply ----
router.post('/:pageId/chat', async (req, res) => {
  const { message, provider, apiKey, model } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!provider || !['anthropic', 'openrouter'].includes(provider)) {
    return res.status(400).json({ error: 'provider must be "anthropic" or "openrouter"' });
  }

  const storage = await getStorage();
  const page = await storage.getPage(req.params.siteId, req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  const currentContent = await getCurrentContent(storage, req.params.siteId, req.params.pageId);

  let proposal;
  try {
    proposal = await proposeChange({ page, content: currentContent, message, provider, apiKey, model });
  } catch (err) {
    return res.status(502).json({ error: `AI request failed: ${err.message}` });
  }

  if (!proposal.changes || proposal.changes.length === 0) {
    return res.json({ applied: false, reply: proposal.reply, changes: [], errors: [] });
  }

  const result = runGuardian(page, currentContent, proposal.changes);
  if (!result.ok) {
    return res.json({ applied: false, reply: proposal.reply, changes: proposal.changes, errors: result.errors });
  }

  const versions = await storage.listVersions(req.params.siteId, req.params.pageId);
  const nextVersionNumber = versions.length > 0 ? versions[versions.length - 1].version + 1 : 1;

  const version = {
    id: uuidv4(),
    pageId: page.id,
    version: nextVersionNumber,
    createdAt: new Date().toISOString(),
    author: req.user.role === 'owner' ? 'owner' : `client:${req.user.siteId}`,
    message: `AI: ${message}`,
    content: result.content,
  };

  await storage.addVersion(req.params.siteId, page.id, version);
  await storage.updatePage(req.params.siteId, page.id, { currentVersionId: version.id });

  res.json({
    applied: true,
    reply: proposal.reply,
    changes: result.sanitized,
    version: { ...version, content: undefined },
    content: result.content,
  });
});

module.exports = router;
