function isAuthenticated() {
  return !!localStorage.getItem('kosmosAuthToken');
}

function getAuthName() {
  return localStorage.getItem('kosmosAuthName') || 'Friend';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
  }
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = '/';
  }
}

function personalizeHomePage() {
  if (!isAuthenticated()) {
    return;
  }

  const heroTitle = document.querySelector('.hero-card h1');
  const heroText = document.querySelector('.hero-card p');
  const heroActions = document.querySelector('.hero-actions');

  if (!heroTitle || !heroText || !heroActions) {
    return;
  }

  heroTitle.textContent = `Welcome back, ${getAuthName()}`;
  heroText.textContent = 'Continue your Greek learning journey in your Kosmos dashboard.';
  heroActions.innerHTML = '';

  const dashboardLink = document.createElement('a');
  dashboardLink.className = 'button button-primary';
  dashboardLink.href = '/dashboard.html';
  dashboardLink.textContent = 'Go to Dashboard';

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'button button-secondary';
  logoutButton.textContent = 'Logout';
  logoutButton.addEventListener('click', logoutUser);

  heroActions.appendChild(dashboardLink);
  heroActions.appendChild(logoutButton);
}

function setAuthState(token, name) {
  localStorage.setItem('kosmosAuthToken', token);
  localStorage.setItem('kosmosAuthName', name || 'Student');
}

function clearAuthState() {
  localStorage.removeItem('kosmosAuthToken');
  localStorage.removeItem('kosmosAuthName');
}

async function loginUser(credentials) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (data.success) {
      setAuthState(data.token, data.name);
      window.location.href = '/dashboard.html';
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Unable to contact the server.' };
  }
}

async function signupUser(payload) {
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.success) {
      window.location.href = '/dashboard.html';
      setAuthState(data.token, data.name);
      return { success: true };
    }
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: 'Unable to contact the server.' };
  }
}

function logoutUser() {
  clearAuthState();
  window.location.href = '/login.html';
}

function loadAuthNav() {
  const nav = document.getElementById('nav-auth');
  if (!nav) {
    return;
  }

  nav.innerHTML = '';

  if (isAuthenticated()) {
    const nameLabel = document.createElement('span');
    nameLabel.textContent = `Hi, ${getAuthName()}`;
    nameLabel.className = 'nav-name';

    const logoutLink = document.createElement('button');
    logoutLink.type = 'button';
    logoutLink.className = 'button logout-button';
    logoutLink.textContent = 'Logout';
    logoutLink.addEventListener('click', logoutUser);

    nav.appendChild(nameLabel);
    nav.appendChild(logoutLink);
    return;
  }

  const loginLink = document.createElement('a');
  loginLink.href = '/login.html';
  loginLink.textContent = 'Sign In';
  loginLink.className = 'button button-secondary';

  const signupLink = document.createElement('a');
  signupLink.href = '/signup.html';
  signupLink.textContent = 'Sign Up';
  signupLink.className = 'button button-primary';

  nav.appendChild(loginLink);
  nav.appendChild(signupLink);
}
