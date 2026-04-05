const fs = require('fs');
const p = 'c:/PYTHON/Arena/app/(tabs)/videos.tsx';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
for (let i = 600; i <= 1065; i++) { if (lines[i-1] 
