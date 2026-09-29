const fs = require('fs');
const path = require('path');

// Minimal valid PNG buffer
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
for (const f of files) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, pngBuffer);
  }
}

console.log('Mobile assets initialized successfully.');
