const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

const ROOT = config.dataDir;

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readJson(p, fallback = null) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(p, data) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

const sitePath = (siteId) => path.join(ROOT, 'sites', siteId, 'site.json');
const pagesDir = (siteId) => path.join(ROOT, 'sites', siteId, 'pages');
const pagePath = (siteId, pageId) => path.join(pagesDir(siteId), pageId, 'page.json');
const versionsDir = (siteId, pageId) => path.join(pagesDir(siteId), pageId, 'versions');
const versionPath = (siteId, pageId, versionId) => path.join(versionsDir(siteId, pageId), `${versionId}.json`);
const publishesDir = (siteId) => path.join(ROOT, 'sites', siteId, 'publishes');
const publishMetaPath = (siteId, publishId) => path.join(publishesDir(siteId), publishId, 'meta.json');
const publishFilesDir = (siteId, publishId) => path.join(publishesDir(siteId), publishId, 'files');

class FsStorage {
  async init() {
    await ensureDir(path.join(ROOT, 'sites'));
  }

  // ---- Sites ----
  async listSites() {
    const sitesDir = path.join(ROOT, 'sites');
    await ensureDir(sitesDir);
    const ids = await fs.readdir(sitesDir);
    const sites = [];
    for (const id of ids) {
      const site = await readJson(sitePath(id));
      if (site) sites.push(site);
    }
    return sites;
  }

  async getSite(siteId) {
    return readJson(sitePath(siteId));
  }

  async createSite(site) {
    await writeJson(sitePath(site.id), site);
    return site;
  }

  async updateSite(siteId, patch) {
    const site = await this.getSite(siteId);
    if (!site) return null;
    const updated = { ...site, ...patch };
    await writeJson(sitePath(siteId), updated);
    return updated;
  }

  async deleteSite(siteId) {
    await fs.rm(path.join(ROOT, 'sites', siteId), { recursive: true, force: true });
  }

  // ---- Pages ----
  async listPages(siteId) {
    const dir = pagesDir(siteId);
    await ensureDir(dir);
    const ids = await fs.readdir(dir);
    const pages = [];
    for (const id of ids) {
      const page = await readJson(pagePath(siteId, id));
      if (page) pages.push(page);
    }
    return pages;
  }

  async getPage(siteId, pageId) {
    return readJson(pagePath(siteId, pageId));
  }

  async createPage(page) {
    await writeJson(pagePath(page.siteId, page.id), page);
    return page;
  }

  async updatePage(siteId, pageId, patch) {
    const page = await this.getPage(siteId, pageId);
    if (!page) return null;
    const updated = { ...page, ...patch };
    await writeJson(pagePath(siteId, pageId), updated);
    return updated;
  }

  async deletePage(siteId, pageId) {
    await fs.rm(path.join(pagesDir(siteId), pageId), { recursive: true, force: true });
  }

  // ---- Content versions ----
  async listVersions(siteId, pageId) {
    const dir = versionsDir(siteId, pageId);
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const versions = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const v = await readJson(path.join(dir, f));
      if (v) versions.push(v);
    }
    versions.sort((a, b) => a.version - b.version);
    return versions;
  }

  async getVersion(siteId, pageId, versionId) {
    return readJson(versionPath(siteId, pageId, versionId));
  }

  async addVersion(siteId, pageId, version) {
    await writeJson(versionPath(siteId, pageId, version.id), version);
    return version;
  }

  // ---- Publishes ----
  async listPublishes(siteId) {
    const dir = publishesDir(siteId);
    await ensureDir(dir);
    const ids = await fs.readdir(dir);
    const publishes = [];
    for (const id of ids) {
      const meta = await readJson(publishMetaPath(siteId, id));
      if (meta) publishes.push(meta);
    }
    publishes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return publishes;
  }

  async getPublish(siteId, publishId) {
    return readJson(publishMetaPath(siteId, publishId));
  }

  async addPublish(siteId, publish, files) {
    await writeJson(publishMetaPath(siteId, publish.id), publish);
    const dir = publishFilesDir(siteId, publish.id);
    await ensureDir(dir);
    for (const [filename, content] of Object.entries(files)) {
      const fp = path.join(dir, filename);
      await ensureDir(path.dirname(fp));
      await fs.writeFile(fp, content, 'utf8');
    }
    return publish;
  }

  async getPublishFiles(siteId, publishId) {
    const dir = publishFilesDir(siteId, publishId);
    const result = {};
    async function walk(base, rel) {
      const entries = await fs.readdir(path.join(base, rel), { withFileTypes: true });
      for (const e of entries) {
        const relPath = path.join(rel, e.name);
        if (e.isDirectory()) {
          await walk(base, relPath);
        } else {
          result[relPath.split(path.sep).join('/')] = await fs.readFile(path.join(base, relPath), 'utf8');
        }
      }
    }
    try {
      await walk(dir, '.');
      // strip leading "./"
      const cleaned = {};
      for (const [k, v] of Object.entries(result)) {
        cleaned[k.replace(/^\.\//, '')] = v;
      }
      return cleaned;
    } catch (err) {
      if (err.code === 'ENOENT') return {};
      throw err;
    }
  }
}

module.exports = FsStorage;
