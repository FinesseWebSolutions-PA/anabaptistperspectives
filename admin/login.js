(() => {
  const content = document.querySelector('#auth-content');
  const mode = location.pathname.replace(/\/$/, '').split('/').pop();
  let setupToken = '';
  let unsavedRecovery = false;
  if (mode === 'setup') {
    setupToken = new URLSearchParams(location.hash.slice(1)).get('token') || '';
    history.replaceState(null, '', location.pathname + location.search);
  }
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
  const errorMarkup = '<div id="form-error" class="message error" role="alert" hidden></div>';
  const passwordField = (id, label, fresh = false) => `<label class="field"><span>${label}</span><div class="password-wrap"><input id="${id}" name="${id}" type="password" autocomplete="${fresh ? 'new-password' : 'current-password'}" ${fresh ? 'minlength="12" maxlength="128"' : 'maxlength="128"'} required><button class="password-toggle" type="button" data-password="${id}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">Show</button></div>${fresh && id !== 'confirm-password' ? '<small>Use at least 12 characters. A few memorable words work well.</small>' : ''}</label>`;
  const emailField = '<label class="field"><span>Email address</span><input id="email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="you@example.com" required></label>';
  const submitButton = label => `<button class="primary" type="submit"><span>${label}</span>${arrow}</button>`;
  const returnLink = '<a class="return-link" href="/admin/login">Back to sign in</a>';
  function showError(message) {
    const el = document.querySelector('#form-error');
    el.textContent = message;
    el.hidden = false;
  }
  function bindPasswords() {
    document.querySelectorAll('[data-password]').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.password);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Hide' : 'Show';
        button.setAttribute('aria-pressed', String(show));
        button.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} ${input.closest('label').querySelector('span').textContent.toLowerCase()}`);
      });
    });
    const confirmation = document.querySelector('#confirm-password');
    if (confirmation) {
      const validate = () => confirmation.setCustomValidity(confirmation.value !== document.querySelector('#password').value ? 'The passwords do not match.' : '');
      confirmation.addEventListener('input', validate);
      document.querySelector('#password').addEventListener('input', validate);
    }
  }
  async function request(path, payload) {
    const response = await fetch(path, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error('request-failed');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function bindForm(submit, failureMessage) {
    bindPasswords();
    const form = document.querySelector('form');
    let submitting = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      submitting = true;
      document.querySelector('#form-error').hidden = true;
      const buttons = [...form.querySelectorAll('button')];
      const primary = form.querySelector('button[type="submit"] span');
      const originalLabel = primary.textContent;
      buttons.forEach(button => button.disabled = true);
      primary.textContent = 'Just a moment…';
      form.setAttribute('aria-busy', 'true');
      try { await submit(form); }
      catch (error) {
        showError(error.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.' : error.status ? failureMessage : 'We couldn’t connect. Please try again.');
      } finally {
        submitting = false;
        buttons.forEach(button => button.disabled = false);
        primary.textContent = originalLabel;
        form.removeAttribute('aria-busy');
      }
    });
  }
  function login() {
    document.title = 'Sign in · Perspectives Studio';
    content.innerHTML = `<h2>Welcome back.</h2><p class="intro">Sign in to your publishing workspace.</p><form>${errorMarkup}${emailField}${passwordField('password', 'Password')}<div class="form-options"><label class="check"><input type="checkbox" id="remember" name="remember" checked> Keep me signed in</label><a href="/admin/recover">Forgot password?</a></div>${submitButton('Sign in')}</form><p class="form-note">For the Anabaptist Perspectives editorial team.</p>`;
    bindForm(async () => {
      await request('/api/auth/sign-in/email', { email: document.querySelector('#email').value.trim(), password: document.querySelector('#password').value, rememberMe: document.querySelector('#remember').checked });
      location.replace('/admin/');
    }, 'We couldn’t sign you in. Check your email and password, then try again.');
  }
  function savedCode(code, recovered) {
    if (typeof code !== 'string' || !code) throw new Error('missing-recovery-code');
    unsavedRecovery = true;
    content.innerHTML = `<h2>${recovered ? 'Your password is updated.' : 'Your studio is ready.'}</h2><p class="intro">One last thing: save your ${recovered ? 'new ' : ''}recovery code.</p><div class="recovery-box"><p class="label">YOUR PRIVATE RECOVERY CODE</p><code class="recovery-code" id="recovery-code"></code><div class="code-actions"><button class="secondary" id="copy-code" type="button">Copy code</button><button class="secondary" id="download-code" type="button">Download</button></div><p class="code-status" id="code-status" role="status"></p></div><p class="recovery-caption">Keep this in your password manager or another private place. You’ll need it to reset a forgotten password. ${recovered ? 'Your previous recovery code no longer works.' : 'It is only shown here once.'}</p><label class="check recovery-check"><input id="saved-code" type="checkbox"> I’ve saved my recovery code somewhere safe.</label><button class="primary" id="continue-sign-in" type="button" disabled>Continue to sign in ${arrow}</button>`;
    document.querySelector('#recovery-code').textContent = code;
    document.querySelector('#copy-code').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        document.querySelector('#code-status').textContent = 'Copied. Save it somewhere private.';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('#recovery-code'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.querySelector('#code-status').textContent = 'Select and copy the code above.';
      }
    });
    document.querySelector('#download-code').addEventListener('click', () => {
      const file = new Blob(['Perspectives Studio — private recovery code\n\n' + code + '\n\nKeep this code private. It can be used with your administrator email at ' + location.origin + '/admin/recover to reset your password.\nUsing it creates a replacement code; save the replacement and discard this copy.\n'], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'perspectives-studio-recovery-code.txt';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.querySelector('#code-status').textContent = 'Downloaded. Keep the file somewhere private.';
    });
    document.querySelector('#saved-code').addEventListener('change', event => {
      unsavedRecovery = !event.target.checked;
      document.querySelector('#continue-sign-in').disabled = !event.target.checked;
    });
    document.querySelector('#continue-sign-in').addEventListener('click', () => location.replace('/admin/login'));
  }
  async function setup() {
    document.title = 'Set your password · Perspectives Studio';
    content.innerHTML = '<h2>Welcome to your studio.</h2><p class="intro">Checking your private setup link…</p>';
    if (!setupToken) return setupUnavailable();
    try {
      const response = await fetch('/api/auth/setup-info', { credentials: 'same-origin', headers: { Authorization: 'Bearer ' + setupToken }, cache: 'no-store' });
      if (!response.ok) return setupUnavailable();
      const data = await response.json();
      if (typeof data.email !== 'string' || !data.email) return setupUnavailable();
      content.innerHTML = `<h2>Make yourself at home.</h2><p class="intro">Choose a password for your administrator account.</p><form>${errorMarkup}${emailField}${passwordField('password', 'Create a password', true)}${passwordField('confirm-password', 'Confirm password', true)}${submitButton('Set my password')}</form>`;
      document.querySelector('#email').value = data.email;
      document.querySelector('#email').readOnly = true;
      bindForm(async () => {
        const data = await request('/api/auth/setup', { token: setupToken, password: document.querySelector('#password').value });
        setupToken = '';
        savedCode(data.recoveryCode, false);
      }, 'This setup link could not be used. It may have expired or already been used. Please request a new private link from the site owner.');
    } catch { setupUnavailable(); }
  }
  function setupUnavailable() {
    setupToken = '';
    content.innerHTML = '<h2>Let’s get you connected.</h2><p class="intro">This private setup link is missing, expired, or already used.</p><p class="message notice">If you’ve already set your password, you can sign in. Otherwise, ask the site owner for a new setup link.</p><a class="primary" href="/admin/login">Go to sign in ' + arrow + '</a>';
  }
  function recovery() {
    document.title = 'Reset your password · Perspectives Studio';
    content.innerHTML = `<h2>A fresh start.</h2><p class="intro">Use the recovery code you saved when setting up your account to choose a new password.</p><form>${errorMarkup}${emailField}<label class="field"><span>Recovery code</span><input id="recovery-code-input" name="recoveryCode" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" required maxlength="200"><small>Find it in your password manager or saved recovery file.</small></label>${passwordField('password', 'New password', true)}${passwordField('confirm-password', 'Confirm password', true)}${submitButton('Reset password')}</form>${returnLink}<p class="form-note">Can’t find your recovery code? Contact the site owner to restore access.</p>`;
    bindForm(async () => {
      const data = await request('/api/auth/recover', { email: document.querySelector('#email').value.trim(), recoveryCode: document.querySelector('#recovery-code-input').value.trim(), newPassword: document.querySelector('#password').value });
      savedCode(data.recoveryCode, true);
    }, 'We couldn’t reset your password. Check your email and recovery code, then try again.');
  }
  window.addEventListener('beforeunload', event => {
    if (unsavedRecovery) { event.preventDefault(); event.returnValue = ''; }
  });
  if (mode === 'setup') setup();
  else if (mode === 'recover') recovery();
  else login();
})();
