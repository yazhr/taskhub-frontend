const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const filesToCopy = ['index.html', 'main.js', 'styles.css'];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const fileName of filesToCopy) {
  const sourcePath = path.join(rootDir, fileName);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(distDir, fileName));
  }
}

console.log(`Built static frontend into ${distDir}`);