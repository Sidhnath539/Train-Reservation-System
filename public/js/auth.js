/**
 * RAILORA - Auth Page Logic (Login, Registration & Password Reset)
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const forgotTab = document.getElementById('tab-forgot');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const linkForgot = document.getElementById('link-forgot-pass');
  const btnBackToLogin = document.getElementById('btn-back-to-login');

  // Check URL params for active tab (?tab=register or ?tab=forgot)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  if (requestedTab === 'register') {
    switchTab('register');
  } else if (requestedTab === 'forgot') {
    switchTab('forgot');
  }

  if (loginTab) loginTab.addEventListener('click', () => switchTab('login'));
  if (registerTab) registerTab.addEventListener('click', () => switchTab('register'));
  if (linkForgot) {
    linkForgot.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('forgot');
    });
  }
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('login');
    });
  }

  function switchTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      if (registerTab) registerTab.classList.remove('active');
      if (forgotTab) {
        forgotTab.classList.remove('active');
        forgotTab.classList.add('auth-tab-hidden');
      }
      if (loginForm) loginForm.classList.remove('auth-form-hidden');
      if (registerForm) registerForm.classList.add('auth-form-hidden');
      if (forgotForm) forgotForm.classList.add('auth-form-hidden');
    } else if (tab === 'register') {
      registerTab.classList.add('active');
      if (loginTab) loginTab.classList.remove('active');
      if (forgotTab) {
        forgotTab.classList.remove('active');
        forgotTab.classList.add('auth-tab-hidden');
      }
      if (loginForm) loginForm.classList.add('auth-form-hidden');
      if (registerForm) registerForm.classList.remove('auth-form-hidden');
      if (forgotForm) forgotForm.classList.add('auth-form-hidden');
    } else if (tab === 'forgot') {
      if (loginTab) loginTab.classList.remove('active');
      if (registerTab) registerTab.classList.remove('active');
      if (forgotTab) {
        forgotTab.classList.remove('auth-tab-hidden');
        forgotTab.classList.add('active');
      }
      if (loginForm) loginForm.classList.add('auth-form-hidden');
      if (registerForm) registerForm.classList.add('auth-form-hidden');
      if (forgotForm) forgotForm.classList.remove('auth-form-hidden');
    }
  }

  // Handle Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying credentials...';

      try {
        const data = await fetchWithAuth('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        setToken(data.token);
        setUser(data.user);
        showToast('Login successful! Redirecting...', 'success');

        const redirect = urlParams.get('redirect') || (data.user.role === 'admin' ? '/admin.html' : '/');
        setTimeout(() => {
          window.location.href = redirect;
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In to Railora';
      }
    });
  }

  // Handle Registration Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating account...';

      try {
        const data = await fetchWithAuth('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, password })
        });

        setToken(data.token);
        setUser(data.user);
        showToast('Account created successfully! Welcome aboard.', 'success');

        const redirect = urlParams.get('redirect') || '/';
        setTimeout(() => {
          window.location.href = redirect;
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Account';
      }
    });
  }

  // Handle Forgot / Reset Password Submit
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value.trim();
      const phone = document.getElementById('reset-phone').value.trim();
      const new_password = document.getElementById('reset-password').value;
      const confirm_password = document.getElementById('reset-confirm-password').value;
      const submitBtn = forgotForm.querySelector('button[type="submit"]');

      if (!email) {
        showToast('Please enter your registered email.', 'warning');
        return;
      }

      if (new_password.length < 6) {
        showToast('New password must be at least 6 characters long.', 'warning');
        return;
      }

      if (new_password !== confirm_password) {
        showToast('New passwords do not match.', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying & resetting...';

      try {
        const data = await fetchWithAuth('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, phone, new_password })
        });

        showToast(data.message, 'success');

        // Auto-fill the email in login form
        const loginEmail = document.getElementById('login-email');
        if (loginEmail) loginEmail.value = email;

        // Clear password fields
        document.getElementById('reset-password').value = '';
        document.getElementById('reset-confirm-password').value = '';

        submitBtn.disabled = false;
        submitBtn.innerText = 'Reset Password';

        // Switch to sign in view
        setTimeout(() => {
          switchTab('login');
          showToast('Please sign in with your new password.', 'info');
        }, 1200);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Reset Password';
      }
    });
  }
});
