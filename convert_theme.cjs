const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-zinc-950/g, 'bg-zinc-50');
  content = content.replace(/bg-zinc-900/g, 'bg-white');
  content = content.replace(/bg-zinc-800/g, 'bg-zinc-100');
  content = content.replace(/bg-zinc-700/g, 'bg-zinc-200');
  
  // Borders
  content = content.replace(/border-zinc-800/g, 'border-zinc-200');
  content = content.replace(/border-zinc-700/g, 'border-zinc-300');
  content = content.replace(/border-white\/10/g, 'border-black/10');
  content = content.replace(/border-white\/5/g, 'border-black/5');
  
  // Text
  content = content.replace(/text-zinc-500/g, 'text-zinc-500'); // keep same
  content = content.replace(/text-zinc-400/g, 'text-zinc-600');
  content = content.replace(/text-zinc-300/g, 'text-zinc-700');
  content = content.replace(/text-zinc-200/g, 'text-zinc-800');
  content = content.replace(/text-zinc-100/g, 'text-zinc-900');
  
  // Explicit text-white fixes where it is used as a heading or text (and not in buttons)
  content = content.replace(/text-white(?! border-zinc-700)(?! font-medium rounded-xl)(?! text-xs font-bold)/g, 'text-foreground');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done mapping zinc colors');
