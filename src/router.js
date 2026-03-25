const routes = {};
let currentView = null;
let appContainer = null;

function init(container) {
  appContainer = container;
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function register(hash, view) {
  routes[hash] = view;
}

function navigate(hash, params) {
  window._routeParams = params || {};
  if (window.location.hash === hash) {
    handleRoute();
  } else {
    window.location.hash = hash;
  }
}

function handleRoute() {
  if (currentView && currentView.cleanup) currentView.cleanup();
  const hash = window.location.hash || '#dashboard';
  currentView = routes[hash];
  if (currentView) {
    appContainer.innerHTML = '';
    currentView.render(appContainer, window._routeParams || {});
  }
}

module.exports = { init, register, navigate };
