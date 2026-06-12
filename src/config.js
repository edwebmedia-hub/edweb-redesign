require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  ownerMasterKey: process.env.OWNER_MASTER_KEY || 'change-me-master-key',
  jwtSecret: process.env.JWT_SECRET || 'change-me-jwt-secret',
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
  mongodbUri: process.env.MONGODB_URI || null,

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',

  openrouterApiKey: process.env.OPENROUTER_API_KEY || null,
  openrouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-6',

  vercelToken: process.env.VERCEL_TOKEN || null,
  vercelTeamId: process.env.VERCEL_TEAM_ID || null,
};
