// Общие шапка/подвал + обработка форм заявок.
// BRAND — рабочее название, меняется в одном месте.
const BRAND = { name: 'AgroAI', suffix: 'Holding', email: 'hello@agroai.example' };

const NAV = [
  { href: '/', label: 'Холдинг' },
  { href: '/it', label: 'ИТ / ERP' },
  { href: '/agro', label: 'Агро-консалтинг' },
  { href: '/market', label: 'Маркетплейс' },
  { href: '/join', label: 'Для аграриев' },
];

function renderLayout() {
  const path = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'header';
    header.innerHTML = `
      <div class="container">
        <a class="logo" href="/"><span class="logo-mark">◆</span>${BRAND.name} <span class="muted" style="font-weight:600">${BRAND.suffix}</span></a>
        <button class="nav-toggle" aria-label="Меню" aria-expanded="false">☰</button>
        <nav class="nav">
          ${NAV.map((n) => `<a href="${n.href}" class="${n.href === path ? 'active' : ''}">${n.label}</a>`).join('')}
          <a class="btn btn-primary btn-sm" href="/#contact">Связаться</a>
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
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="container">
        <div class="grid">
          <div>
            <a class="logo" href="/" style="color:#fff"><span class="logo-mark">◆</span>${BRAND.name} ${BRAND.suffix}</a>
            <p style="margin-top:14px;max-width:340px">Цифровизация агробизнеса и вывод фермерской продукции на мировые рынки и маркетплейсы.</p>
          </div>
          <div><h4>Направления</h4><ul>
            <li><a href="/it">Внедрение ERP</a></li>
            <li><a href="/agro">Агро-консалтинг</a></li>
            <li><a href="/agro#marketplaces">Выход на маркетплейсы</a></li>
          </ul></div>
          <div><h4>Платформа</h4><ul>
            <li><a href="/join">Регистрация аграриев</a></li>
            <li><a href="/market">Закрытый маркетплейс</a></li>
          </ul></div>
          <div><h4>Контакты</h4><ul>
            <li><a href="mailto:${BRAND.email}">${BRAND.email}</a></li>
            <li><a href="#" data-todo="linkedin">LinkedIn</a></li>
          </ul></div>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} ${BRAND.name} ${BRAND.suffix}. Все права защищены.</div>
      </div>`;
  }
}

async function postJSON(url, data, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Ошибка отправки');
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
        await postJSON('/api/leads', Object.fromEntries(new FormData(form)));
        form.reset();
        showMsg(msg, 'Спасибо! Мы свяжемся с вами в течение одного рабочего дня.', true);
      } catch (err) {
        showMsg(msg, err.message, false);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

renderLayout();
bindLeadForms();

// Подписи для справочников (маркетплейс, админка)
const LABELS = {
  category: {
    grain: 'Зерновые', oilseeds: 'Масличные', fruits: 'Фрукты, ягоды', vegetables: 'Овощи', nuts: 'Орехи',
    dried: 'Сухофрукты', honey: 'Мёд', oil: 'Масла', wine: 'Вино', processed: 'Переработка', other: 'Другое',
  },
  unit: { t: 'т', kg: 'кг', l: 'л', pcs: 'шт' },
  cert: {
    globalgap: 'GlobalG.A.P.', organic: 'Organic', haccp: 'HACCP', iso22000: 'ISO 22000', brc: 'BRC',
    ifs: 'IFS', halal: 'Halal', kosher: 'Kosher', fda: 'FDA',
  },
  exportExperience: { none: 'нет экспорта', some: 'разовый экспорт', regular: 'регулярный экспорт' },
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
