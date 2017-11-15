/**
 * Find components that depend on the requested component.
 *
 * Usage:
 * ```
 * $ node depend-on.js px-timeline
 * ```
 */

const info = require('./info.json');

let componentName;
for (let i=0; i<process.argv.length; i++) {
  if (process.argv[i][0] !== '/') {
    componentName = process.argv[i];
  }
}
if (!componentName) {
  throw new Error('Must pass a component name');
}

const dependOn = [];
for (let {name, latest} of info) {
  let deps = Object.assign({}, latest.dependencies || {}, latest.devDependencies || {});
  let depNames = Object.keys(deps);
  if (depNames.indexOf(componentName) !== -1) {
    dependOn.push(name);
  }
}
console.log(`${componentName} is a dependency of ${dependOn.length} components`)
dependOn.forEach(d => console.log(`-- ${d}`));
