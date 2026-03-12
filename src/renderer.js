import './index.css';

document.getElementById('toggle-btn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Show a banner when a new version is available
window.electronAPI.onUpdateAvailable((version) => {
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `Update v${version} available! <a href="#" id="update-link">Download</a>`;
  document.body.prepend(banner);

  document.getElementById('update-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.electronAPI.openReleases();
  });
});
