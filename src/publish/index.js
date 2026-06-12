const { v4: uuidv4 } = require('uuid');
const { getStorage } = require('../storage');
const { renderPage } = require('../render');
const { getCurrentContent } = require('../util/content');
const config = require('../config');
const vercel = require('./vercel');

function pageOutputPath(slug) {
  const clean = (slug || '').replace(/^\/+|\/+$/g, '');
  if (!clean) return 'index.html';
  return `${clean}/index.html`;
}

/**
 * Render every page of a site with its current content into a static HTML
 * bundle, store it as an immutable snapshot, and (if configured) deploy it
 * to the site's host.
 */
async function publishSite(siteId) {
  const storage = await getStorage();
  const site = await storage.getSite(siteId);
  if (!site) throw new Error('Site not found');

  const pages = await storage.listPages(siteId);
  const files = {};
  const pageMeta = [];

  for (const page of pages) {
    const content = await getCurrentContent(storage, siteId, page.id);
    const html = renderPage(page.template, content, { stripSlotAttrs: true });
    const outPath = pageOutputPath(page.slug);
    files[outPath] = html;
    pageMeta.push({ pageId: page.id, slug: page.slug, path: outPath, currentVersionId: page.currentVersionId || null });
  }

  const publish = {
    id: uuidv4(),
    siteId,
    createdAt: new Date().toISOString(),
    pages: pageMeta,
    deployment: null,
    deploymentError: null,
  };

  const publishConfig = site.publish || {};
  if (publishConfig.vercelProjectName) {
    try {
      publish.deployment = await vercel.deploy({
        token: publishConfig.vercelToken || config.vercelToken,
        teamId: publishConfig.vercelTeamId || config.vercelTeamId,
        projectName: publishConfig.vercelProjectName,
        files,
      });
    } catch (err) {
      publish.deploymentError = err.message;
    }
  }

  await storage.addPublish(siteId, publish, files);
  return publish;
}

module.exports = { publishSite, pageOutputPath };
