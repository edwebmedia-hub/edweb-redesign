const config = require('../config');
const FsStorage = require('./fsStorage');
const MongoStorage = require('./mongoStorage');

let instance = null;

async function getStorage() {
  if (instance) return instance;
  if (config.mongodbUri) {
    instance = new MongoStorage(config.mongodbUri);
  } else {
    instance = new FsStorage();
  }
  await instance.init();
  return instance;
}

module.exports = { getStorage };
