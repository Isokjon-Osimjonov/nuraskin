const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'apps/frontend/src/api');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Add import api
  if (!content.includes(`import { api } from '@/lib/api'`)) {
    content = `import { api } from '@/lib/api';\n` + content;
  }

  // Remove apiFetch import
  content = content.replace(/import \{ apiFetch \} from '[^']+';\n/g, '');
  content = content.replace(/import \{ apiFetch \} from '[^']+';/g, '');

  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+)\)/g, 'api.get<any>($1)');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'POST',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.post<any>($1, $2)');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'PATCH',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.patch<any>($1, $2)');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'api.delete<any>($1)');

  // For raw apiFetch like apiFetch('/url', { method: 'POST', body: formData })
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'POST',\s*body:\s*([^}]+)\}\)/g, 'api.post<any>($1, $2)');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'PATCH',\s*body:\s*([^}]+)\}\)/g, 'api.patch<any>($1, $2)');

  // Simple GET calls
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'GET'\s*\}\)/g, 'api.get<any>($1)');

  // Edge cases where it is passed as a callback or arguments
  content = content.replace(/api\.post\('\/storefront\/waitlist', \$3\);/g, "api.post<any>('/storefront/waitlist', arguments[1]);");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
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

walkDir(apiDir);
