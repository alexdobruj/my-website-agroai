// Анкета аграрія (/join, /en/join) → POST /api/farmers
(() => {
  const TEXT = {
    uk: { ok: 'Анкету надіслано! Ми перевіримо дані та звʼяжемося з вами.' },
    en: { ok: 'Your application has been sent! We will review it and get in touch.' },
  }[LANG];

  const productsEl = document.getElementById('products');
  const tpl = document.getElementById('product-tpl');
  function addProduct() {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.remove').addEventListener('click', () => {
      if (productsEl.children.length > 1) node.remove();
    });
    productsEl.appendChild(node);
  }
  document.getElementById('add-product').addEventListener('click', () => {
    if (productsEl.children.length < 10) addProduct();
  });
  addProduct();

  const form = document.getElementById('farmer-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      company: fd.get('company'),
      contactName: fd.get('contactName'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      country: fd.get('country'),
      region: fd.get('region'),
      hectares: fd.get('hectares'),
      exportExperience: fd.get('exportExperience'),
      hasErp: fd.get('hasErp'),
      certifications: fd.getAll('certifications'),
      goals: fd.getAll('goals'),
      comment: fd.get('comment'),
      consent: fd.get('consent') === 'on',
      lang: LANG,
      products: [...productsEl.children].map((row) => ({
        product: row.querySelector('[name=product]').value,
        category: row.querySelector('[name=category]').value,
        volume: row.querySelector('[name=volume]').value,
        unit: row.querySelector('[name=unit]').value,
        season: row.querySelector('[name=season]').value,
      })),
    };
    const msg = form.querySelector('.form-msg');
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      await postJSON('/api/farmers', data);
      form.reset();
      productsEl.innerHTML = '';
      addProduct();
      showMsg(msg, TEXT.ok, true);
    } catch (err) {
      showMsg(msg, err.message, false);
    } finally {
      btn.disabled = false;
    }
  });
})();
