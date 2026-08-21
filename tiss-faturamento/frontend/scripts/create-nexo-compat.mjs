import { copyFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const assets = resolve('public/nexo/assets');
const aliases = [
  ['nexo-app.js', 'index-DEzECamV.js'],
  ['nexo-app.css', 'index-DjIVxaWu.css'],
  ['nexo-app.js', 'index-C2g0fGUK.js'],
  ['nexo-app.css', 'index-CyxAOIf7.css']
];

await access(resolve(assets, 'nexo-app.js'));
await access(resolve(assets, 'nexo-app.css'));
await Promise.all(aliases.map(([source, target]) => copyFile(resolve(assets, source), resolve(assets, target))));
console.log('Aliases de compatibilidade do Nexo HIS atualizados.');
