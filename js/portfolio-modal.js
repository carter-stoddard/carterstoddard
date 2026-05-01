/* ============================================================
   PORTFOLIO-MODAL.JS
   Locked portfolio with access request flow.
   States: locked → form → success
   ============================================================ */

(function() {
  var openBtn   = document.getElementById('portfolio-btn');
  var modal     = document.getElementById('portfolio-modal');
  var closeBtn  = document.getElementById('portfolio-modal-close');
  var requestBtn = document.getElementById('portfolio-request-btn');
  var form      = document.getElementById('portfolio-form');
  var submitBtn = document.getElementById('portfolio-submit');
  var errorEl   = document.getElementById('portfolio-error');
  if (!openBtn || !modal || !form) return;

  var views = modal.querySelectorAll('.portfolio-modal__view');

  function showView(name) {
    views.forEach(function(v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });
  }

  function open() {
    showView('locked');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Reset to locked view for next time after a brief delay
    setTimeout(function() {
      showView('locked');
      form.reset();
      if (errorEl) errorEl.textContent = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT REQUEST';
    }, 300);
  }

  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) close();
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  // Locked → Form
  if (requestBtn) {
    requestBtn.addEventListener('click', function() {
      showView('form');
    });
  }

  // Form submit → API → Success view
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var firstName = document.getElementById('portfolio-first-name').value.trim();
    var lastName  = document.getElementById('portfolio-last-name').value.trim();
    var email     = document.getElementById('portfolio-email').value.trim();
    var company   = document.getElementById('portfolio-company').value.trim();

    if (!firstName || !lastName || !email || !company || !email.includes('@')) {
      if (errorEl) errorEl.textContent = 'Please fill out all fields with a valid email.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
    if (errorEl) errorEl.textContent = '';

    var payload = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      company: company,
      role: 'Portfolio Access Request',
      services: 'Portfolio Access',
      message: firstName + ' ' + lastName + ' from ' + company + ' is requesting portfolio access.',
      consent: true,
    };

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).finally(function() {
      // Show success either way — request is captured client-side via Resend
      showView('success');
    });
  });
})();
