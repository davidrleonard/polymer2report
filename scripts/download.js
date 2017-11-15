/*
 * Downloads bower data for all component repos and sends result to stdout
 * as JSON.
 *
 * Usage:
 * ```
 * $ node scripts/download.js > info.json
 * ```
 */

const {exec} = require('child_process');
const bower = require('bower');
const repos = require('./repo-list');

async function getBowerInfo(packageName) {
  return new Promise((resolve, reject) => {
    bower.commands.info(packageName).on('end', (info) => {
      resolve(info);
    })
  });
}

(async () => {
  const components = repos.filter(r => !/-design$/.test(r));
  const info = await Promise.all(
    components.map(getBowerInfo)
  );
  console.log(JSON.stringify(info, null, ''));
})();
