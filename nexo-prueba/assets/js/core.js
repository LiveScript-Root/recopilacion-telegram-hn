'use strict';
(function (root) {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
  const clean = (value, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  function telegramLink(value) {
    try {
      const u = new URL(clean(value, 300));
      if (u.protocol !== 'https:' || !['t.me', 'telegram.me'].includes(u.hostname.toLowerCase()) || u.username || u.password || u.port) return null;
      if (!/^\/(?:\+[A-Za-z0-9_-]+|joinchat\/[A-Za-z0-9_-]+|[A-Za-z][A-Za-z0-9_]{4,31})\/?$/.test(u.pathname) || u.search || u.hash) return null;
      return 'https://t.me' + u.pathname;
    } catch { return null; }
  }
  function telegramUsername(value) {
    const name = clean(value, 40).replace(/^@/, '');
    return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(name) ? '@' + name : null;
  }
  function email(value) {
    const v = clean(value, 254).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
  }
  function draftFrom(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return {
      profileName: clean(value.profileName, 60), telegramLink: clean(value.telegramLink, 250),
      email: clean(value.email, 254), contactTelegram: clean(value.contactTelegram, 33),
      relation: clean(value.relation, 100), note: clean(value.note, 1500),
      coverName: clean(value.coverName, 250), authorized: value.authorized === true,
      adult: value.adult === true, createdAt: clean(value.createdAt, 40), requestId: clean(value.requestId, 40)
    };
  }
  function validDraft(d) {
    return !!(d && d.profileName && telegramLink(d.telegramLink) && email(d.email) && telegramUsername(d.contactTelegram) && d.relation && d.authorized && d.adult);
  }
  root.NexoCore = Object.freeze({ normalize, clean, telegramLink, telegramUsername, email, draftFrom, validDraft });
})(typeof window !== 'undefined' ? window : globalThis);
