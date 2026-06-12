/**
 * Resolve the currently-active content map for a page (the one rendered in
 * the editor preview and used for publishing).
 */
async function getCurrentContent(storage, siteId, pageId) {
  const page = await storage.getPage(siteId, pageId);
  if (!page) return {};
  if (page.currentVersionId) {
    const version = await storage.getVersion(siteId, pageId, page.currentVersionId);
    if (version) return version.content;
  }
  const versions = await storage.listVersions(siteId, pageId);
  if (versions.length === 0) return {};
  return versions[versions.length - 1].content;
}

module.exports = { getCurrentContent };
