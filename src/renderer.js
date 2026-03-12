import './index.css';

document.getElementById('toggle-btn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

const updateBtn = document.getElementById('update-btn');
const updateStatus = document.getElementById('update-status');

let pendingDmgUrl = null;

updateBtn.addEventListener('click', async () => {
  // If we already found an update, install it
  if (pendingDmgUrl) {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Downloading...';
    updateStatus.textContent = '0%';

    window.electronAPI.onDownloadProgress((percent) => {
      updateStatus.textContent = `${percent}%`;
    });

    try {
      await window.electronAPI.installUpdate(pendingDmgUrl);
      updateBtn.textContent = 'DMG Opened!';
      updateStatus.textContent = 'Drag LogicMonkey to Applications, then relaunch.';
    } catch {
      updateBtn.textContent = 'Download Failed';
      updateStatus.textContent = 'Try again later.';
    }
    return;
  }

  // Otherwise, check for updates
  updateBtn.disabled = true;
  updateBtn.textContent = 'Checking...';
  updateStatus.textContent = '';

  const result = await window.electronAPI.checkForUpdate();

  if (result.hasUpdate && result.dmgUrl) {
    pendingDmgUrl = result.dmgUrl;
    updateBtn.textContent = `Install ${result.version}`;
    updateBtn.disabled = false;
    updateStatus.textContent = 'New version found!';
  } else if (result.hasUpdate && !result.dmgUrl) {
    updateBtn.textContent = 'Check for Updates';
    updateBtn.disabled = false;
    updateStatus.textContent = 'Update available but no DMG found in release.';
  } else if (result.error) {
    updateBtn.textContent = 'Check for Updates';
    updateBtn.disabled = false;
    updateStatus.textContent = result.error;
  } else {
    updateBtn.textContent = 'Check for Updates';
    updateBtn.disabled = false;
    updateStatus.textContent = 'You\'re up to date!';
  }
});
