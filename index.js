const {exec} = require('child_process');
const ProgressBar = require('progress');
const bower = require('bower');
const {
  reset,
  bold,
  light,
  red,
  green,
  percent,
  justify
} = require('./helpers');
const repos = require('./scripts/repo-list');
const l = console.log;

const getDependentCount = (name, infoList) => {
  let count = 0;
  for (let {latest} of infoList) {
    if (latest.dependencies && latest.dependencies.hasOwnProperty(name)) {
      count++;
    }
    if (latest.devDependencies && latest.devDependencies.hasOwnProperty(name)) {
      count++;
    }
  }
  return count;
}

async function getBowerInfo(packageName) {
  return new Promise((resolve, reject) => {
    bower.commands.info(packageName).on('end', (info) => {
      resolve(info);
    })
  });
}

/* Report generator */
(async () => {
  l('Starting report, this might take a while...');


  const components = repos.filter(r => !/-design$/.test(r));
  const bar = new ProgressBar('Downloaded :current/:total components from bower [:bar] :percent', {
    total: components.length,
    width: 25
  });
  const info = await Promise.all(components.map(async (r) => {
    try {
      const componentInfo = await getBowerInfo(r);
      bar.tick();
      return componentInfo;
    } catch (e) {
      console.log(`${r} failed: ${e}`);
    }
  }));

  const cssModules = repos.filter(r => /-design$/.test(r));
  const cssBar = new ProgressBar('Downloaded :current/:total CSS modules from bower [:bar] :percent', {
    total: cssModules.length,
    width: 25
  });
  const cssInfo = await Promise.all(cssModules.map(async (r) => {
    try {
      const componentInfo = await getBowerInfo(r);
      cssBar.tick();
      return componentInfo;
    } catch (e) {
      console.log(`${r} failed: ${e}`);
    }
  }));

  l('');
  l(bold(`Polymer 2.x Upgrade Report`));
  l('');

  // COMPONENTS

  let polymer2 = [];
  let polymer1 = [];
  for (let {name, latest} of info) {
    if (/1\.9 - 2/.test(latest.dependencies.polymer)) {
      polymer2.push({ name: name, version: latest.version, depCount: getDependentCount(name, info), deps: latest.dependencies||{}, devDeps: latest.devDependencies||{} });
    } else {
      polymer1.push({ name: name, version: latest.version, depCount: getDependentCount(name, info), deps: latest.dependencies||{}, devDeps: latest.devDependencies||{} });
    }
  }

  // Sort by # of dependants
  polymer2.sort((a,b) => b.depCount - a.depCount);
  polymer1.sort((a,b) => b.depCount - a.depCount);

  // Check for any Polymer 2.x components with dependencies that aren't ready
  for (let c of polymer2) {
    let deps = Object.keys(c.deps);
    let devDeps = Object.keys(c.devDeps);
    let incompatibles = deps.concat(devDeps)
      .filter(d => /^px-/.test(d) && !/-design$/.test(d))
      .filter(d => polymer1.filter(({name}) => name === d).length > 0);
    c.incompatibles = incompatibles;
  }

  l(bold('Components progress:'));
  l(`• % of components upgraded: ${green(percent(polymer2.length, components.length))}`);
  l(`• # of components upgraded: ${green(polymer2.length)}/${components.length} (${polymer1.length} left)`);
  l('');
  l(bold('Upgraded components:'))
  polymer2.forEach(({name, version, depCount, incompatibles}) => {
    l(justify(60, `  - ${name}`, `v${version} [${depCount} depend]`));
    if (incompatibles.length) {
      l(red(`    ... ${incompatibles.length} dependencies need to be upgraded: ${incompatibles.join(', ')}`));
    }
  });
  l('');
  l(bold('Remaining components:'))
  polymer1.forEach(({name, version, depCount}) => {
    l(justify(60, `  - ${name}`, `v${version} [${depCount} depend]`))
  });

  // CSS MODULES

  let cssPolymer2 = [];
  let cssPolymer1 = [];
  for (let {name, latest} of cssInfo) {
    if (latest.devDependencies['px-sass-doc'] === '^2.0.0') {
      cssPolymer2.push({ name: name, version: latest.version });
    } else {
      cssPolymer1.push({ name: name, version: latest.version });
    }
  }

  l('')
  l(justify(60, `|`, `|`, '-'))
  l('')
  l(bold('CSS module progress:'));
  l(`• % of CSS modules upgraded: ${green(percent(cssPolymer2.length, cssModules.length))}`);
  l(`• # of CSS modules upgraded: ${green(cssPolymer2.length)}/${cssModules.length} (${cssPolymer1.length} left)`);
  l('');
  l(bold('Upgraded CSS modules:'))
  cssPolymer2.forEach(({name, version}) => {
    l(justify(60, `  - ${name}`, `v${version}`));
  });
  l('');
  l(bold('Remaining CSS components:'))
  cssPolymer1.forEach(({name, version}) => {
    l(justify(60, `  - ${name}`, `v${version}`))
  });
})();
