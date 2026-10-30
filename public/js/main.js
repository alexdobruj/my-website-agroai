// Общие шапка/подвал, переключатель языка, словари и отправка форм.
// Язык страницы берётся из <html lang>: uk — корень сайта, en — раздел /en/.
// BRAND — рабочее название и контакты, меняются в одном месте.
const BRAND = { name: 'AgroAI', suffix: 'Holding', email: 'hello@agroai.com', domain: 'agroai.com' };

const LANG = document.documentElement.lang === 'en' ? 'en' : 'uk';
const PREFIX = LANG === 'en' ? '/en' : '';

const I18N = {
  uk: {
    nav: [['/', 'Холдинг'], ['/it', 'ІТ / ERP'], ['/agro', 'Агроконсалтинг'], ['/market', 'Маркетплейс'], ['/join', 'Для аграріїв']],
    contact: "Зв'язатися",
    menu: 'Меню',
    tagline: 'Цифровізація агробізнесу та вихід української агропродукції на ринки ЄС і світу.',
    fDirections: 'Напрями', fPlatform: 'Платформа', fContacts: 'Контакти',
    fLinks: [['/it', 'Впровадження ERP'], ['/agro', 'Агроконсалтинг'], ['/agro#marketplaces', 'Вихід на маркетплейси']],
    fPlatformLinks: [['/join', 'Реєстрація аграріїв'], ['/market', 'Закритий маркетплейс']],
    rights: 'Усі права захищено.',
    leadOk: "Дякуємо! Ми зв'яжемося з вами протягом одного робочого дня.",
    sendError: 'Помилка надсилання',
  },
  en: {
    nav: [['/', 'Holding'], ['/it', 'IT / ERP'], ['/agro', 'Agri consulting'], ['/market', 'Marketplace'], ['/join', 'For growers']],
    contact: 'Contact us',
    menu: 'Menu',
    tagline: 'Digital transformation for agribusiness and market access for Ukrainian agri products in the EU and worldwide.',
    fDirections: 'Services', fPlatform: 'Platform', fContacts: 'Contacts',
    fLinks: [['/it', 'ERP implementation'], ['/agro', 'Agri consulting'], ['/agro#marketplaces', 'Marketplace sales']],
    fPlatformLinks: [['/join', 'Grower registration'], ['/market', 'Closed marketplace']],
    rights: 'All rights reserved.',
    leadOk: 'Thank you! We will get back to you within one business day.',
    sendError: 'Could not send the form',
  },
};
const T = I18N[LANG];

// Путь этой же страницы на другом языке: /it <-> /en/it
function altPath(target) {
  const clean = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  const base = clean.replace(/^\/en(\/|$)/, '/') || '/';
  return (target === 'en' ? '/en' + (base === '/' ? '/' : base) : base) + location.hash;
}

function renderLayout() {
  const current = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/^\/en(\/|$)/, '/') || '/';
  const link = (href) => PREFIX + (href === '/' && PREFIX ? '/' : href);
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'header';
    header.innerHTML = `
      <div class="container">
        <a class="logo" href="${link('/')}"><span class="logo-mark">◆</span>${BRAND.name} <span class="muted" style="font-weight:600">${BRAND.suffix}</span></a>
        <button class="nav-toggle" aria-label="${T.menu}" aria-expanded="false">☰</button>
        <nav class="nav">
          ${T.nav.map(([href, label]) => `<a href="${link(href)}" class="${href === current ? 'active' : ''}">${label}</a>`).join('')}
          <span class="lang-switch">
            <a href="${altPath('uk')}" class="${LANG === 'uk' ? 'active' : ''}" hreflang="uk" lang="uk">UA</a>
            <a href="${altPath('en')}" class="${LANG === 'en' ? 'active' : ''}" hreflang="en" lang="en">EN</a>
          </span>
          <a class="btn btn-primary btn-sm" href="${link('/')}#contact">${T.contact}</a>
        </nav>
      </div>`;
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.nav');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    const list = (items) => items.map(([href, label]) => `<li><a href="${link(href)}">${label}</a></li>`).join('');
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="container">
        <div class="grid">
          <div>
            <a class="logo" href="${link('/')}" style="color:#fff"><span class="logo-mark">◆</span>${BRAND.name} ${BRAND.suffix}</a>
            <p style="margin-top:14px;max-width:340px">${T.tagline}</p>
          </div>
          <div><h4>${T.fDirections}</h4><ul>${list(T.fLinks)}</ul></div>
          <div><h4>${T.fPlatform}</h4><ul>${list(T.fPlatformLinks)}</ul></div>
          <div><h4>${T.fContacts}</h4><ul>
            <li><a href="mailto:${BRAND.email}">${BRAND.email}</a></li>
            <li><a href="#" data-todo="linkedin">LinkedIn</a></li>
          </ul></div>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} ${BRAND.name} ${BRAND.suffix}. ${T.rights}</div>
      </div>`;
  }

  document.querySelectorAll('[data-brand-email]').forEach((a) => {
    a.href = 'mailto:' + BRAND.email;
    a.textContent = BRAND.email;
  });
}

async function postJSON(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lang': LANG, ...headers },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || T.sendError);
  return body;
}

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'err');
}

// Формы с атрибутом data-lead-form → POST /api/leads
function bindLeadForms() {
  document.querySelectorAll('form[data-lead-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = form.querySelector('.form-msg');
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      try {
        await postJSON('/api/leads', { ...Object.fromEntries(new FormData(form)), lang: LANG });
        form.reset();
        showMsg(msg, T.leadOk, true);
      } catch (err) {
        showMsg(msg, err.message, false);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// Подписи для справочников (маркетплейс, админка). Админка внутренняя — берёт uk.
const LABELS_ALL = {
  uk: {
    category: {
      grain: 'Зернові', oilseeds: 'Олійні', fruits: 'Фрукти, ягоди', vegetables: 'Овочі', nuts: 'Горіхи',
      dried: 'Сухофрукти', honey: 'Мед', oil: 'Олія', wine: 'Вино', processed: 'Переробка', other: 'Інше',
    },
    unit: { t: 'т', kg: 'кг', l: 'л', pcs: 'шт' },
    exportExperience: { none: 'без експорту', some: 'разовий експорт', regular: 'регулярний експорт' },
  },
  en: {
    category: {
      grain: 'Grain', oilseeds: 'Oilseeds', fruits: 'Fruits & berries', vegetables: 'Vegetables', nuts: 'Nuts',
      dried: 'Dried fruits', honey: 'Honey', oil: 'Oils', wine: 'Wine', processed: 'Processed food', other: 'Other',
    },
    unit: { t: 't', kg: 'kg', l: 'l', pcs: 'pcs' },
    exportExperience: { none: 'no export yet', some: 'occasional export', regular: 'regular exporter' },
  },
};
const LABELS = {
  ...LABELS_ALL[LANG],
  cert: {
    globalgap: 'GlobalG.A.P.', organic: 'Organic (EU)', haccp: 'HACCP', iso22000: 'ISO 22000', brc: 'BRC',
    ifs: 'IFS', halal: 'Halal', kosher: 'Kosher', fda: 'FDA',
  },
};

// Безопасное построение DOM: строки всегда идут через textContent.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  children.flat().forEach((c) => {
    if (c == null || c === false) return;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return node;
}

// Області України: код зберігається в базі, підпис — мовою сторінки.
const REGIONS = {
  uk: {
    'vinnytsia': 'Вінницька обл.',
    'volyn': 'Волинська обл.',
    'dnipropetrovsk': 'Дніпропетровська обл.',
    'donetsk': 'Донецька обл.',
    'zhytomyr': 'Житомирська обл.',
    'zakarpattia': 'Закарпатська обл.',
    'zaporizhzhia': 'Запорізька обл.',
    'ivano-frankivsk': 'Івано-Франківська обл.',
    'kyiv': 'Київська обл.',
    'kirovohrad': 'Кіровоградська обл.',
    'luhansk': 'Луганська обл.',
    'lviv': 'Львівська обл.',
    'mykolaiv': 'Миколаївська обл.',
    'odesa': 'Одеська обл.',
    'poltava': 'Полтавська обл.',
    'rivne': 'Рівненська обл.',
    'sumy': 'Сумська обл.',
    'ternopil': 'Тернопільська обл.',
    'kharkiv': 'Харківська обл.',
    'kherson': 'Херсонська обл.',
    'khmelnytskyi': 'Хмельницька обл.',
    'cherkasy': 'Черкаська обл.',
    'chernivtsi': 'Чернівецька обл.',
    'chernihiv': 'Чернігівська обл.',
    'crimea': 'АР Крим',
  },
  en: {
    'vinnytsia': 'Vinnytsia Oblast',
    'volyn': 'Volyn Oblast',
    'dnipropetrovsk': 'Dnipropetrovsk Oblast',
    'donetsk': 'Donetsk Oblast',
    'zhytomyr': 'Zhytomyr Oblast',
    'zakarpattia': 'Zakarpattia Oblast',
    'zaporizhzhia': 'Zaporizhzhia Oblast',
    'ivano-frankivsk': 'Ivano-Frankivsk Oblast',
    'kyiv': 'Kyiv Oblast',
    'kirovohrad': 'Kirovohrad Oblast',
    'luhansk': 'Luhansk Oblast',
    'lviv': 'Lviv Oblast',
    'mykolaiv': 'Mykolaiv Oblast',
    'odesa': 'Odesa Oblast',
    'poltava': 'Poltava Oblast',
    'rivne': 'Rivne Oblast',
    'sumy': 'Sumy Oblast',
    'ternopil': 'Ternopil Oblast',
    'kharkiv': 'Kharkiv Oblast',
    'kherson': 'Kherson Oblast',
    'khmelnytskyi': 'Khmelnytskyi Oblast',
    'cherkasy': 'Cherkasy Oblast',
    'chernivtsi': 'Chernivtsi Oblast',
    'chernihiv': 'Chernihiv Oblast',
    'crimea': 'Autonomous Republic of Crimea',
  },
}[LANG];
LABELS.region = REGIONS;

// <select data-regions> заповнюється списком областей
document.querySelectorAll('select[data-regions]').forEach((sel) => {
  Object.entries(REGIONS).forEach(([value, label]) => sel.append(el('option', { value }, label)));
});

renderLayout();
bindLeadForms();
