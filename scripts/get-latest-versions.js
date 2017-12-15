/*
 * Gets the latest version of all repos.
 *
 * Usage:
 * ```
 * $ node scripts/get-latest-versions.js
 * ```
 */

const {exec} = require('child_process');
const bower = require('bower');
const {rcompare} = require('semver');
const repos = require('./repo-list');
const l = console.log;

/* Helpers */
const reset = (s) => `\x1b[0m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const light = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

function getLatestVersion(list) {
  const versions = [...list];
  versions.sort(rcompare);
  return versions[0];
};

function justify(len, str1, str2) {
  let numDots = len - str1.length - str2.length;
  let dots = '.'.repeat(numDots);
  return str1 + light(dots) + str2;
}

async function getBowerInfo(packageName) {
  return new Promise((resolve, reject) => {
    bower.commands.info(packageName).on('end', (info) => {
      resolve(info);
    })
  });
};

(async () => {
  const data = await Promise.all(repos.map(getBowerInfo));

  l(bold(`Latest versions for ${data.length} components:`));
  data.forEach(component => {
    let {name, versions} = component;
    let latest = getLatestVersion(versions);
    let formattedVersion = green(latest);
    l(justify(50, name, formattedVersion));
  });
})();
