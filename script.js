const STORAGE_KEY = 'contact_webhook_url';

// Elements - Step 1
const stepWebhook = document.getElementById('step-webhook');
const webhookInput = document.getElementById('webhookUrl');
const btnSaveWebhook = document.getElementById('btnSaveWebhook');
const webhookError = document.getElementById('webhookError');

// Elements - Step 2
const stepForm = document.getElementById('step-form');
const contactForm = document.getElementById('contactForm');
const btnChangeWebhook = document.getElementById('btnChangeWebhook');
const submitStatus = document.getElementById('submitStatus');

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    showFormStep(saved);
  } else {
    showWebhookStep();
  }
}

// ─── Step navigation ─────────────────────────────────────────────────────────

function showWebhookStep() {
  stepWebhook.classList.remove('hidden');
  stepForm.classList.add('hidden');
  webhookInput.value = localStorage.getItem(STORAGE_KEY) || '';
  webhookError.textContent = '';
}

function showFormStep(webhookUrl) {
  stepWebhook.classList.add('hidden');
  stepForm.classList.remove('hidden');

  // Show the saved webhook URL as a badge under the heading
  let badge = document.getElementById('webhookBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'webhookBadge';
    badge.className = 'webhook-badge';
    const subtitle = stepForm.querySelector('.subtitle');
    subtitle.insertAdjacentElement('afterend', badge);
  }
  badge.innerHTML = `Sending to: <span>${escapeHtml(webhookUrl)}</span>`;
}

// ─── Step 1: Save webhook ─────────────────────────────────────────────────────

btnSaveWebhook.addEventListener('click', () => {
  const url = webhookInput.value.trim();

  if (!url) {
    webhookError.textContent = 'Please enter a webhook URL.';
    webhookInput.focus();
    return;
  }

  if (!isValidUrl(url)) {
    webhookError.textContent = 'Please enter a valid URL (e.g. https://...).';
    webhookInput.focus();
    return;
  }

  webhookError.textContent = '';
  localStorage.setItem(STORAGE_KEY, url);
  showFormStep(url);
});

// Allow Enter key on webhook input
webhookInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnSaveWebhook.click();
});

// ─── Step 2: Change webhook ───────────────────────────────────────────────────

btnChangeWebhook.addEventListener('click', () => {
  showWebhookStep();
});

// ─── Step 2: Contact form submission ─────────────────────────────────────────

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const webhookUrl = localStorage.getItem(STORAGE_KEY);
  if (!webhookUrl) {
    showWebhookStep();
    return;
  }

  const payload = {
    firstName: getValue('firstName'),
    lastName: getValue('lastName'),
    phone: '+94' + getValue('phone'),
    address: getValue('address'),
    email: getValue('email'),
    message: getValue('message'),
    submittedAt: new Date().toISOString(),
  };

  setSubmitState(true);
  hideStatus();

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      showStatus('success', 'Your message has been sent successfully!');
      contactForm.reset();
    } else {
      showStatus('error', `Submission failed (HTTP ${response.status}). Please try again.`);
    }
  } catch (err) {
    // Network error or CORS — try no-cors fallback for simple webhooks
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showStatus('success', 'Your message has been sent successfully!');
      contactForm.reset();
    } catch {
      showStatus('error', 'Could not reach the webhook. Check the URL and try again.');
    }
  } finally {
    setSubmitState(false);
  }
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm() {
  let valid = true;

  const firstName = getValue('firstName');
  const lastName = getValue('lastName');
  const phone = getValue('phone');
  const email = getValue('email');

  setError('firstName', '');
  setError('lastName', '');
  setError('phone', '');
  setError('email', '');

  if (!firstName) {
    setError('firstName', 'First name is required.');
    valid = false;
  }

  if (!lastName) {
    setError('lastName', 'Last name is required.');
    valid = false;
  }

  if (!phone) {
    setError('phone', 'Phone number is required.');
    valid = false;
  } else if (!/^\d{7,10}$/.test(phone)) {
    setError('phone', 'Enter a valid phone number (7–10 digits).');
    valid = false;
  }

  if (!email) {
    setError('email', 'Email is required.');
    valid = false;
  } else if (!isValidEmail(email)) {
    setError('email', 'Enter a valid email address.');
    valid = false;
  }

  return valid;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function setError(fieldId, message) {
  const el = document.getElementById('err' + capitalize(fieldId));
  if (el) el.textContent = message;
  const input = document.getElementById(fieldId);
  if (input) input.classList.toggle('invalid', !!message);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function showStatus(type, message) {
  submitStatus.textContent = message;
  submitStatus.className = `status-msg ${type}`;
}

function hideStatus() {
  submitStatus.className = 'status-msg hidden';
  submitStatus.textContent = '';
}

function setSubmitState(loading) {
  const btn = contactForm.querySelector('.btn-submit');
  btn.disabled = loading;
  btn.textContent = loading ? 'Sending...' : 'Submit';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Start ────────────────────────────────────────────────────────────────────

init();
