const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'apps/admin/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Single line arrow functions
  content = content.replace(/onError:\s*\((?:err|error)(?:\s*:\s*any)?\)\s*=>\s*toast\.error\((.*?)(?:\.message|\.message \|\| '[^']+'|\.message \|\| "[^"]+")?\)/g, (match, p1) => {
    // Check if it's using translateServerError
    if (p1.includes('translateServerError')) {
      return `onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(translateServerError(msg));
    }`;
    }
    return `onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    }`;
  });

  // Multiline block functions for toast.error
  content = content.replace(/onError:\s*\((?:err|error)(?:\s*:\s*any)?\)\s*=>\s*\{\s*toast\.error\((.*?)(?:\.message|\.message \|\| '[^']+'|\.message \|\| "[^"]+")?\);?\s*\}/g, (match, p1) => {
    return `onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    }`;
  });

  // Sometimes it's like this:
  // onError: (err: any) => {
  //   toast.error(err.message || 'Xatolik');
  // }
  // My multiline regex above might miss some due to newlines and spaces. Let's do a more robust one.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(adminDir);
