const { MongoClient } = require('mongodb');
const config = require('../config');

class MongoStorage {
  constructor(uri) {
    this.uri = uri;
    this.client = new MongoClient(uri);
    this.db = null;
  }

  async init() {
    await this.client.connect();
    this.db = this.client.db();
    await this.db.collection('sites').createIndex({ id: 1 }, { unique: true });
    await this.db.collection('pages').createIndex({ id: 1 }, { unique: true });
    await this.db.collection('pages').createIndex({ siteId: 1 });
    await this.db.collection('versions').createIndex({ id: 1 }, { unique: true });
    await this.db.collection('versions').createIndex({ pageId: 1, version: 1 });
    await this.db.collection('publishes').createIndex({ id: 1 }, { unique: true });
    await this.db.collection('publishes').createIndex({ siteId: 1 });
  }

  _strip(doc) {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return rest;
  }

  // ---- Sites ----
  async listSites() {
    const docs = await this.db.collection('sites').find({}).toArray();
    return docs.map((d) => this._strip(d));
  }

  async getSite(siteId) {
    return this._strip(await this.db.collection('sites').findOne({ id: siteId }));
  }

  async createSite(site) {
    await this.db.collection('sites').insertOne({ ...site });
    return site;
  }

  async updateSite(siteId, patch) {
    const result = await this.db.collection('sites').findOneAndUpdate(
      { id: siteId },
      { $set: patch },
      { returnDocument: 'after' }
    );
    return this._strip(result.value || result);
  }

  async deleteSite(siteId) {
    await this.db.collection('sites').deleteOne({ id: siteId });
    await this.db.collection('pages').deleteMany({ siteId });
    await this.db.collection('versions').deleteMany({ siteId });
    await this.db.collection('publishes').deleteMany({ siteId });
  }

  // ---- Pages ----
  async listPages(siteId) {
    const docs = await this.db.collection('pages').find({ siteId }).toArray();
    return docs.map((d) => this._strip(d));
  }

  async getPage(siteId, pageId) {
    return this._strip(await this.db.collection('pages').findOne({ siteId, id: pageId }));
  }

  async createPage(page) {
    await this.db.collection('pages').insertOne({ ...page });
    return page;
  }

  async updatePage(siteId, pageId, patch) {
    const result = await this.db.collection('pages').findOneAndUpdate(
      { siteId, id: pageId },
      { $set: patch },
      { returnDocument: 'after' }
    );
    return this._strip(result.value || result);
  }

  async deletePage(siteId, pageId) {
    await this.db.collection('pages').deleteOne({ siteId, id: pageId });
    await this.db.collection('versions').deleteMany({ siteId, pageId });
  }

  // ---- Content versions ----
  async listVersions(siteId, pageId) {
    const docs = await this.db.collection('versions').find({ siteId, pageId }).sort({ version: 1 }).toArray();
    return docs.map((d) => this._strip(d));
  }

  async getVersion(siteId, pageId, versionId) {
    return this._strip(await this.db.collection('versions').findOne({ siteId, pageId, id: versionId }));
  }

  async addVersion(siteId, pageId, version) {
    await this.db.collection('versions').insertOne({ siteId, pageId, ...version });
    return version;
  }

  // ---- Publishes ----
  async listPublishes(siteId) {
    const docs = await this.db.collection('publishes').find({ siteId }).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => this._strip(d));
  }

  async getPublish(siteId, publishId) {
    return this._strip(await this.db.collection('publishes').findOne({ siteId, id: publishId }));
  }

  async addPublish(siteId, publish, files) {
    await this.db.collection('publishes').insertOne({ ...publish, siteId, files });
    return publish;
  }

  async getPublishFiles(siteId, publishId) {
    const doc = await this.db.collection('publishes').findOne({ siteId, id: publishId });
    return (doc && doc.files) || {};
  }
}

module.exports = MongoStorage;
