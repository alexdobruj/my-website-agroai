// Закрита вітрина для покупців (/market, /en/market)
(() => {
  const TEXT = {
    uk: {
      allCats: 'Усі категорії', allRegions: 'Усі регіони', request: 'Запитати', requestTitle: 'Запит',
      loadError: 'Помилка завантаження',
      sent: 'Запит надіслано. Менеджер холдингу звʼяжеться з вами та постачальником.',
    },
    en: {
      allCats: 'All categories', allRegions: 'All regions', request: 'Request', requestTitle: 'Request',
      loadError: 'Could not load offers',
      sent: 'Request sent. Our manager will contact you and the supplier.',
    },
  }[LANG];

  const KEY = 'agroai-invite';
  let invite = '';
  try { invite = sessionStorage.getItem(KEY) || ''; } catch (e) {}
  let offers = [];
  let currentOffer = null;

  const $ = (id) => document.getElementById(id);

  async function loadOffers() {
    const res = await fetch('/api/market/offers', { headers: { 'X-Invite-Code': invite, 'X-Lang': LANG } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || TEXT.loadError);
    offers = body.offers;
    fillFilters();
    render();
    $('login').hidden = true;
    $('catalog').hidden = false;
  }

  function fillFilters() {
    const cats = [...new Set(offers.map((o) => o.category))];
    const regions = [...new Set(offers.map((o) => o.region).filter(Boolean))].sort();
    $('cat').replaceChildren(el('option', { value: '' }, TEXT.allCats),
      ...cats.map((c) => el('option', { value: c }, LABELS.category[c] || c)));
    $('region').replaceChildren(el('option', { value: '' }, TEXT.allRegions),
      ...regions.map((r) => el('option', { value: r }, LABELS.region[r] || r)));
  }

  function render() {
    const q = $('q').value.trim().toLowerCase();
    const cat = $('cat').value;
    const region = $('region').value;
    const list = offers.filter((o) =>
      (!q || o.product.toLowerCase().includes(q)) && (!cat || o.category === cat) && (!region || o.region === region));
    $('rows').replaceChildren(...list.map((o) => el('tr', {},
      el('td', {}, el('b', {}, o.product)),
      el('td', {}, LABELS.category[o.category] || o.category),
      el('td', {}, o.volume ? `${o.volume} ${LABELS.unit[o.unit] || o.unit}` : '—'),
      el('td', {}, o.season || '—'),
      el('td', {}, el('span', { class: 'tag' }, o.supplier), el('div', { class: 'muted' }, LABELS.exportExperience[o.exportExperience] || '')),
      el('td', {}, LABELS.region[o.region] || o.region || o.country),
      el('td', {}, o.certifications.length ? o.certifications.map((c) => el('span', { class: 'tag tag--wheat' }, LABELS.cert[c] || c)) : '—'),
      el('td', {}, el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => openRequest(o) }, TEXT.request)),
    )));
    $('empty').hidden = list.length > 0;
  }

  function openRequest(o) {
    currentOffer = o;
    $('req-title').textContent = `${TEXT.requestTitle}: ${o.product} (${o.supplier})`;
    $('request-form').querySelector('.form-msg').className = 'form-msg';
    $('modal').classList.add('open');
  }

  $('close-modal').addEventListener('click', () => $('modal').classList.remove('open'));
  ['q', 'cat', 'region'].forEach((id) => $(id).addEventListener('input', render));

  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    invite = $('invite').value.trim();
    try {
      await loadOffers();
      try { sessionStorage.setItem(KEY, invite); } catch (err) {}
    } catch (err) {
      showMsg($('login').querySelector('.form-msg'), err.message, false);
    }
  });

  $('logout').addEventListener('click', () => {
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    location.reload();
  });

  $('request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const msg = form.querySelector('.form-msg');
    try {
      await postJSON('/api/market/requests',
        { offerId: currentOffer.id, ...Object.fromEntries(new FormData(form)) },
        { 'X-Invite-Code': invite });
      form.reset();
      showMsg(msg, TEXT.sent, true);
    } catch (err) {
      showMsg(msg, err.message, false);
    }
  });

  if (invite) loadOffers().catch(() => {});
})();
