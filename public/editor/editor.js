(() => {
  const state = {
    me: null,
    sites: [],
    siteId: null,
    site: null,
    pages: [],
    pageId: null,
    page: null,
    content: {},
    versions: [],
    selectedSlotId: null,
  };

  // ---------- API helper ----------
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin',
    });
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    if (!res.ok) {
      const err = new Error((data && (data.error || JSON.stringify(data.errors))) || res.statusText);
      err.data = data;
      throw err;
    }
    return data;
  }

  // ---------- Elements ----------
  const el = {
    userInfo: document.getElementById('userInfo'),
    logoutBtn: document.getElementById('logoutBtn'),
    siteSelect: document.getElementById('siteSelect'),
    ownerSiteControls: document.getElementById('ownerSiteControls'),
    newSiteForm: document.getElementById('newSiteForm'),
    newSiteName: document.getElementById('newSiteName'),
    siteSettingsForm: document.getElementById('siteSettingsForm'),
    siteIdDisplay: document.getElementById('siteIdDisplay'),
    clientPasswordInput: document.getElementById('clientPasswordInput'),
    vercelProjectName: document.getElementById('vercelProjectName'),
    vercelToken: document.getElementById('vercelToken'),
    vercelTeamId: document.getElementById('vercelTeamId'),
    pageList: document.getElementById('pageList'),
    ingestForm: document.getElementById('ingestForm'),
    ingestUrl: document.getElementById('ingestUrl'),
    ingestSlug: document.getElementById('ingestSlug'),
    ingestName: document.getElementById('ingestName'),
    ingestStatus: document.getElementById('ingestStatus'),
    versionList: document.getElementById('versionList'),
    publishBtn: document.getElementById('publishBtn'),
    publishStatus: document.getElementById('publishStatus'),
    publishList: document.getElementById('publishList'),
    pageTitle: document.getElementById('pageTitle'),
    refreshPreviewBtn: document.getElementById('refreshPreviewBtn'),
    preview: document.getElementById('preview'),
    editPanel: document.getElementById('editPanel'),
    editPanelBody: document.getElementById('editPanelBody'),
    editStatus: document.getElementById('editStatus'),
    saveSlotBtn: document.getElementById('saveSlotBtn'),
    cancelSlotBtn: document.getElementById('cancelSlotBtn'),
    chatLog: document.getElementById('chatLog'),
    chatForm: document.getElementById('chatForm'),
    aiProvider: document.getElementById('aiProvider'),
    aiApiKey: document.getElementById('aiApiKey'),
    chatInput: document.getElementById('chatInput'),
  };

  // ---------- Init ----------
  async function init() {
    try {
      state.me = await api('/api/auth/me');
    } catch {
      state.me = { authenticated: false };
    }
    if (!state.me.authenticated) {
      window.location.href = '/';
      return;
    }
    el.userInfo.textContent = state.me.role === 'owner' ? 'Owner' : `Client (${state.me.siteId})`;
    if (state.me.role === 'owner') el.ownerSiteControls.hidden = false;

    restoreAiSettings();
    await loadSites();
  }

  el.logoutBtn.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // ---------- Sites ----------
  async function loadSites() {
    state.sites = await api('/api/sites');
    el.siteSelect.innerHTML = '';
    for (const site of state.sites) {
      const opt = document.createElement('option');
      opt.value = site.id;
      opt.textContent = site.name;
      el.siteSelect.appendChild(opt);
    }
    if (state.sites.length > 0) {
      await selectSite(state.sites[0].id);
    }
  }

  el.siteSelect.addEventListener('change', () => selectSite(el.siteSelect.value));

  async function selectSite(siteId) {
    state.siteId = siteId;
    state.site = state.sites.find((s) => s.id === siteId) || await api(`/api/sites/${siteId}`);
    state.pageId = null;
    state.page = null;
    el.preview.removeAttribute('src');
    el.pageTitle.textContent = 'No page selected';
    el.editPanel.hidden = true;

    if (state.me.role === 'owner') {
      el.siteIdDisplay.value = state.site.id;
      el.vercelProjectName.value = (state.site.publish && state.site.publish.vercelProjectName) || '';
      el.vercelTeamId.value = (state.site.publish && state.site.publish.vercelTeamId) || '';
      el.vercelToken.value = '';
      el.clientPasswordInput.value = '';
    }

    await Promise.all([loadPages(), loadPublishes()]);
  }

  el.newSiteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el.newSiteName.value.trim();
    if (!name) return;
    const site = await api('/api/sites', { method: 'POST', body: { name } });
    el.newSiteName.value = '';
    await loadSites();
    el.siteSelect.value = site.id;
    await selectSite(site.id);
  });

  el.siteSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const patch = { publish: {} };
    if (el.clientPasswordInput.value) patch.clientPassword = el.clientPasswordInput.value;
    if (el.vercelProjectName.value) patch.publish.vercelProjectName = el.vercelProjectName.value.trim();
    if (el.vercelToken.value) patch.publish.vercelToken = el.vercelToken.value.trim();
    if (el.vercelTeamId.value) patch.publish.vercelTeamId = el.vercelTeamId.value.trim();
    await api(`/api/sites/${state.siteId}`, { method: 'PATCH', body: patch });
    el.clientPasswordInput.value = '';
    el.vercelToken.value = '';
    await loadSites();
  });

  // ---------- Pages ----------
  async function loadPages() {
    state.pages = await api(`/api/sites/${state.siteId}/pages`);
    el.pageList.innerHTML = '';
    for (const page of state.pages) {
      const li = document.createElement('li');
      li.textContent = page.name || page.slug || '(home)';
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = page.slug ? `/${page.slug}` : '/';
      li.appendChild(meta);
      li.dataset.pageId = page.id;
      if (page.id === state.pageId) li.classList.add('active');
      li.addEventListener('click', () => selectPage(page.id));
      el.pageList.appendChild(li);
    }
    if (!state.pageId && state.pages.length > 0) {
      await selectPage(state.pages[0].id);
    }
  }

  async function selectPage(pageId) {
    state.pageId = pageId;
    [...el.pageList.children].forEach((li) => li.classList.toggle('active', li.dataset.pageId === pageId));

    const page = await api(`/api/sites/${state.siteId}/pages/${pageId}`);
    state.page = page;
    state.content = page.content;
    el.pageTitle.textContent = page.name || page.slug || '(home)';
    el.editPanel.hidden = true;

    loadPreview();
    await loadVersions();
  }

  function loadPreview() {
    if (!state.pageId) return;
    el.preview.src = `/api/sites/${state.siteId}/pages/${state.pageId}/render?editable=true&_=${Date.now()}`;
  }

  el.refreshPreviewBtn.addEventListener('click', loadPreview);

  el.preview.addEventListener('load', () => {
    const doc = el.preview.contentDocument;
    if (!doc) return;

    const style = doc.createElement('style');
    style.textContent = `
      [data-slot-id] { transition: outline 0.1s ease; }
      [data-slot-id]:hover { outline: 2px dashed #2d7ff9; cursor: pointer; }
      [data-slot-id].cms-selected { outline: 2px solid #2d7ff9; }
    `;
    doc.head.appendChild(style);

    doc.querySelectorAll('[data-slot-id]').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        doc.querySelectorAll('[data-slot-id].cms-selected').forEach((n) => n.classList.remove('cms-selected'));
        node.classList.add('cms-selected');
        openEditPanel(node.getAttribute('data-slot-id'));
      });
    });
  });

  // ---------- Ingest ----------
  el.ingestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.ingestStatus.textContent = 'Fetching and tagging page...';
    el.ingestStatus.className = 'status';
    try {
      const page = await api(`/api/sites/${state.siteId}/pages/ingest`, {
        method: 'POST',
        body: {
          url: el.ingestUrl.value.trim(),
          slug: el.ingestSlug.value.trim(),
          name: el.ingestName.value.trim() || undefined,
        },
      });
      el.ingestStatus.textContent = `Ingested "${page.name}" with ${Object.keys(page.slots).length} editable slots.`;
      el.ingestStatus.className = 'status success';
      el.ingestForm.reset();
      await loadPages();
      await selectPage(page.id);
    } catch (err) {
      el.ingestStatus.textContent = err.message;
      el.ingestStatus.className = 'status error';
    }
  });

  // ---------- Edit panel ----------
  function openEditPanel(slotId) {
    state.selectedSlotId = slotId;
    const slot = state.page.slots[slotId];
    const value = state.content[slotId];
    el.editPanel.hidden = false;
    el.editStatus.textContent = '';
    el.editStatus.className = 'status';
    el.editPanelBody.innerHTML = '';

    const title = document.createElement('div');
    title.innerHTML = `<strong>${slot.type}</strong> slot <code>${slotId}</code>${slot.required ? ' (required)' : ''}`;
    title.style.marginBottom = '0.5rem';
    title.style.fontSize = '0.8rem';
    el.editPanelBody.appendChild(title);

    const fields = buildFieldsForSlot(slot, value);
    el.editPanelBody.appendChild(fields);
  }

  function buildFieldsForSlot(slot, value) {
    const wrap = document.createElement('div');

    function field(labelText, name, val, multiline) {
      const label = document.createElement('label');
      const span = document.createElement('span');
      span.textContent = labelText;
      label.appendChild(span);
      const input = document.createElement(multiline ? 'textarea' : 'input');
      input.name = name;
      input.value = val || '';
      label.appendChild(input);
      wrap.appendChild(label);
      return input;
    }

    if (slot.type === 'text') {
      field('Text', 'text', value, true);
    } else if (slot.type === 'image') {
      field('Image URL', 'src', value && value.src);
      field('Alt text', 'alt', value && value.alt);
    } else if (slot.type === 'link') {
      if (!slot.hrefOnly) field('Link text', 'text', value && value.text);
      field('Href', 'href', value && value.href);
    } else if (slot.type === 'button') {
      field('Button text', 'text', value && value.text);
    }

    return wrap;
  }

  function readFieldsForSlot(slot) {
    const inputs = el.editPanelBody.querySelectorAll('input, textarea');
    const data = {};
    inputs.forEach((i) => { data[i.name] = i.value; });

    switch (slot.type) {
      case 'text':
        return data.text;
      case 'image':
        return { src: data.src, alt: data.alt };
      case 'link':
        return { text: slot.hrefOnly ? null : data.text, href: data.href };
      case 'button':
        return { text: data.text };
      default:
        return null;
    }
  }

  el.cancelSlotBtn.addEventListener('click', () => {
    el.editPanel.hidden = true;
    const doc = el.preview.contentDocument;
    if (doc) doc.querySelectorAll('[data-slot-id].cms-selected').forEach((n) => n.classList.remove('cms-selected'));
  });

  el.saveSlotBtn.addEventListener('click', async () => {
    const slotId = state.selectedSlotId;
    const slot = state.page.slots[slotId];
    const value = readFieldsForSlot(slot);

    el.editStatus.textContent = 'Saving...';
    el.editStatus.className = 'status';

    try {
      const result = await api(`/api/sites/${state.siteId}/pages/${state.pageId}/content`, {
        method: 'POST',
        body: { changes: [{ slotId, value }], message: `Edit ${slotId}` },
      });
      state.content = result.content;
      el.editStatus.textContent = 'Saved.';
      el.editStatus.className = 'status success';
      loadPreview();
      await loadVersions();
    } catch (err) {
      const errors = (err.data && err.data.errors) || [err.message];
      el.editStatus.textContent = `Rejected by Guardian:\n${errors.join('\n')}`;
      el.editStatus.className = 'status error';
    }
  });

  // ---------- Versions ----------
  async function loadVersions() {
    state.versions = await api(`/api/sites/${state.siteId}/pages/${state.pageId}/versions`);
    el.versionList.innerHTML = '';
    [...state.versions].reverse().forEach((v) => {
      const li = document.createElement('li');
      const isCurrent = v.id === state.page.currentVersionId;
      li.innerHTML = `<span>v${v.version}${isCurrent ? ' (current)' : ''} — ${escapeHtml(v.message || '')}</span>`;
      if (!isCurrent) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.textContent = 'Rollback';
        btn.style.fontSize = '0.7rem';
        btn.style.padding = '0.15rem 0.4rem';
        btn.addEventListener('click', async () => {
          await api(`/api/sites/${state.siteId}/pages/${state.pageId}/versions/${v.id}/rollback`, { method: 'POST' });
          await selectPage(state.pageId);
        });
        li.appendChild(btn);
      }
      el.versionList.appendChild(li);
    });
  }

  // ---------- Publish ----------
  el.publishBtn.addEventListener('click', async () => {
    el.publishStatus.textContent = 'Publishing...';
    el.publishStatus.className = 'status';
    try {
      const publish = await api(`/api/sites/${state.siteId}/publishes`, { method: 'POST' });
      let msg = `Published snapshot ${publish.id} (${publish.pages.length} page(s)).`;
      if (publish.deployment && publish.deployment.url) msg += ` Deployed: ${publish.deployment.url}`;
      if (publish.deploymentError) msg += ` Deploy error: ${publish.deploymentError}`;
      el.publishStatus.textContent = msg;
      el.publishStatus.className = 'status success';
      await loadPublishes();
    } catch (err) {
      el.publishStatus.textContent = err.message;
      el.publishStatus.className = 'status error';
    }
  });

  async function loadPublishes() {
    const publishes = await api(`/api/sites/${state.siteId}/publishes`);
    el.publishList.innerHTML = '';
    [...publishes].reverse().slice(0, 10).forEach((p) => {
      const li = document.createElement('li');
      const date = new Date(p.createdAt).toLocaleString();
      li.innerHTML = `<span>${date}</span>`;
      el.publishList.appendChild(li);
    });
  }

  // ---------- AI Chat ----------
  function restoreAiSettings() {
    const provider = localStorage.getItem('cms_ai_provider');
    const apiKey = localStorage.getItem('cms_ai_key');
    if (provider) el.aiProvider.value = provider;
    if (apiKey) el.aiApiKey.value = apiKey;
  }

  el.aiProvider.addEventListener('change', () => localStorage.setItem('cms_ai_provider', el.aiProvider.value));
  el.aiApiKey.addEventListener('change', () => localStorage.setItem('cms_ai_key', el.aiApiKey.value));

  function logChat(text, cls) {
    const div = document.createElement('div');
    div.className = `msg ${cls}`;
    div.textContent = text;
    el.chatLog.appendChild(div);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
  }

  el.chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = el.chatInput.value.trim();
    if (!message) return;
    if (!state.pageId) {
      logChat('Select a page first.', 'error');
      return;
    }
    logChat(message, 'user');
    el.chatInput.value = '';

    try {
      const result = await api(`/api/sites/${state.siteId}/pages/${state.pageId}/chat`, {
        method: 'POST',
        body: {
          message,
          provider: el.aiProvider.value,
          apiKey: el.aiApiKey.value || undefined,
        },
      });

      if (result.applied) {
        logChat(result.reply || 'Done.', 'ai');
        const div = document.createElement('div');
        div.className = 'msg changes';
        div.textContent = `Applied ${result.changes.length} change(s) → v${result.version.version}`;
        el.chatLog.appendChild(div);
        state.content = result.content;
        loadPreview();
        await loadVersions();
      } else {
        logChat(result.reply || 'No change applied.', 'ai');
        if (result.errors && result.errors.length) {
          logChat(`Guardian rejected the proposal:\n${result.errors.join('\n')}`, 'error');
        }
      }
    } catch (err) {
      logChat(err.message, 'error');
    }
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  init();
})();
