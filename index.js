const {exec} = require('child_process');
const bower = require('bower');
const l = console.log;

/* Helpers */
const reset = (s) => `\x1b[0m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const light = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const percent = (a,b) => `${((a/b)*100).toFixed(0)}%`;

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

/* Repos */
const repos = [
  "px-accordion",
  "px-actionable-design",
  "px-alert-label",
  "px-alert-message",
  "px-api-viewer",
  "px-app-helpers",
  "px-app-nav",
  "px-box-design",
  "px-box-sizing-design",
  "px-branding-bar",
  "px-breadcrumbs",
  "px-button-group-design",
  "px-buttons-design",
  "px-calendar-picker",
  "px-card",
  "px-chip",
  "px-clearfix-design",
  "px-clipboard",
  "px-code-design",
  "px-code-editor",
  "px-colors-design",
  "px-context-browser",
  "px-d3-imports",
  "px-dark-demo-theme",
  "px-dark-theme",
  "px-data-table",
  "px-datasource",
  "px-datetime-common",
  "px-datetime-field",
  "px-datetime-picker",
  "px-datetime-range-field",
  "px-datetime-range-panel",
  "px-deck-selector",
  "px-defaults-design",
  "px-demo-design",
  "px-demo-snippet",
  "px-demo",
  "px-dropdown",
  "px-file-upload",
  "px-flag-design",
  "px-flexbox-design",
  "px-forms-design",
  "px-functions-design",
  "px-gauge",
  "px-headings-design",
  "px-heatmap-grid",
  "px-helpers-design",
  "px-icon-set",
  "px-iconography-design",
  "px-inbox",
  "px-key-value-pair",
  "px-kpi",
  "px-layout-design",
  "px-list-bare-design",
  "px-list-inline-design",
  "px-list-ui-design",
  "px-login",
  "px-map",
  "px-meta-buttons-design",
  "px-meta-lists-design",
  "px-mixins-design",
  "px-modal",
  "px-moment-imports",
  "px-normalize-design",
  "px-number-formatter",
  "px-overlay",
  "px-panel",
  "px-percent-circle",
  "px-popover",
  "px-progress-bar",
  "px-rangepicker",
  "px-sass-doc",
  "px-shadows-design",
  "px-simple-area-chart",
  "px-simple-bar-chart",
  "px-simple-chart-common-behavior",
  "px-simple-horizontal-bar-chart",
  "px-simple-line-chart",
  "px-simple-win-loss-chart",
  "px-slider",
  "px-spacing-design",
  "px-spacing-responsive-design",
  "px-spinner",
  "px-starter-kit-design",
  "px-steps",
  "px-table-view",
  "px-tables-design",
  "px-tabs",
  "px-theme",
  "px-tile",
  "px-timeline",
  "px-toggle-design",
  "px-toggle",
  "px-tooltip",
  "px-tree",
  "px-typeahead",
  "px-typography-design",
  "px-validation",
  "px-view-header",
  "px-viewport-design",
  "px-vis-demos",
  "px-vis-parallel-coordinates",
  "px-vis-pie-chart",
  "px-vis-polar",
  "px-vis-radar",
  "px-vis-spark",
  "px-vis-timeseries",
  "px-vis-xy-chart",
  "px-vis",
  "px-widget-cards",
  "px-widths-design",
  "px-widths-responsive-design",
  "px-widths-tools-design"
];

/* Report generator */
(async () => {
  l('Generating report, this might take a while...');

  const components = repos.filter(r => !/-design$/.test(r));
  const info = await Promise.all(components.map(r =>
    getBowerInfo(r).catch(e => console.log(`${r} failed: ${e}`))
  ));

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

  l('');
  l(bold(`Polymer 2.x Upgrade Report`));
  l('');
  l(`• % of components upgraded: ${green(percent(polymer2.length, components.length))}`);
  l(`• # of components upgraded: ${green(polymer2.length)}/${components.length} (${polymer1.length} left)`);
  l('');
  l(bold('Upgraded components:'))
  polymer2.forEach(({name, version, depCount, incompatibles}) => {
    l(`  - ${name} v${version} [${depCount} depend on this]`)
    if (incompatibles.length) {
      l(red(`    ... ${incompatibles.length} dependencies need to be upgraded: ${incompatibles.join(', ')}`));
    }
  });
  l('');
  l(bold('Remaining components:'))
  polymer1.forEach(({name, version, depCount}) => l(`  - ${name} [${depCount} depend on this]`))
})();
