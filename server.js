const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./src/config');
const auth = require('./src/auth');
const { getStorage } = require('./src/storage');

const authRoutes = require('./src/routes/auth');
const siteRoutes = require('./src/routes/sites');
const pageRoutes = require('./src/routes/pages');
const publishRoutes = require('./src/routes/publish');

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(auth.authenticate);

app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/sites/:siteId/pages', pageRoutes);
app.use('/api/sites/:siteId/publishes', publishRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

getStorage()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Client CMS listening on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize storage:', err);
    process.exit(1);
  });
