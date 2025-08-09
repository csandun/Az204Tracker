// scripts/patch-lockfile.js
const fs = require('fs');
const path = 'package-lock.json';
if (!fs.existsSync(path)) {
  console.log('No package-lock.json found, skipping patch.');
  process.exit(0);
}
let s = fs.readFileSync(path, 'utf8');

// Replace any private registries with npmjs public.
// Add/adjust lines for your private domains.
s = s.replace(/https:\/\/npm\.pkg\.github\.com\//g, 'https://registry.npmjs.org/');
s = s.replace(/https:\/\/pkgs\.dev\.azure\.com\/[^"]*/g, 'https://registry.npmjs.org/');
s = s.replace(/https:\/\/nexus\.[^/"]+\/[^"]*/g, 'https://registry.npmjs.org/');
s = s.replace(/https:\/\/artifacts?\.[^/"]+\/[^"]*/g, 'https://registry.npmjs.org/');
// Example custom:
s = s.replace('https://simpology-packages-075807644544.d.codeartifact.ap-southeast-2.amazonaws.com/npm/simpology-packages/', 'https://registry.npmjs.org/');

fs.writeFileSync(path, s);
console.log('✅ Patched package-lock.json to use the public registry only.');
