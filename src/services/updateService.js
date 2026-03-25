const https = require('https');
const fs = require('fs');
const path = require('path');
const { app, shell } = require('electron');

const REPO_OWNER = 'george-aristides';
const REPO_NAME = 'LogicMonkey';

function isNewer(remote, current) {
  const r = remote.replace(/^v/, '').split('.').map(Number);
  const c = current.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

/**
 * @param {string} currentVersion
 * @returns {Promise<{hasUpdate: boolean, version?: string, dmgUrl?: string|null, error?: string}>}
 */
function checkForUpdate(currentVersion) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      headers: { 'User-Agent': 'LogicMonkey' },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const remoteVersion = release.tag_name;
          if (isNewer(remoteVersion, currentVersion)) {
            const dmgAsset = release.assets.find((a) => a.name.endsWith('.dmg'));
            resolve({
              hasUpdate: true,
              version: remoteVersion,
              dmgUrl: dmgAsset ? dmgAsset.browser_download_url : null,
            });
          } else {
            resolve({ hasUpdate: false, version: currentVersion });
          }
        } catch {
          resolve({ hasUpdate: false, error: 'Could not parse response' });
        }
      });
    }).on('error', () => {
      resolve({ hasUpdate: false, error: 'No internet connection' });
    });
  });
}

/**
 * @param {string} dmgUrl
 * @param {(percent: number) => void} onProgress
 * @returns {Promise<boolean>}
 */
function downloadAndInstall(dmgUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const dmgPath = path.join(app.getPath('downloads'), 'LogicMonkey-update.dmg');
    const file = fs.createWriteStream(dmgPath);

    const download = (url) => {
      https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          download(res.headers.location);
          return;
        }

        const total = parseInt(res.headers['content-length'], 10);
        let downloaded = 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (total && onProgress) {
            onProgress(Math.round((downloaded / total) * 100));
          }
        });

        res.on('end', () => {
          file.end(() => {
            shell.openPath(dmgPath);
            resolve(true);
          });
        });
      }).on('error', (err) => {
        reject(err.message);
      });
    };

    download(dmgUrl);
  });
}

module.exports = { checkForUpdate, downloadAndInstall };
