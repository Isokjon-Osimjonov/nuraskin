const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'apps/admin/src');
const frontendDir = path.join(__dirname, 'apps/frontend/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Remove fetchWithAuth and API_BASE definitions
  content = content.replace(/import \{ useAuthStore \} from '[^']+';\n/g, '');
  content = content.replace(/const API_BASE = import\.meta\.env\.VITE_API_BASE_URL;\n?/g, '');
  
  // This removes the async function fetchWithAuth block
  content = content.replace(/async function fetchWithAuth\([\s\S]*?\n\}\n/g, '');

  // Ensure api import
  if ((content.includes('fetchWithAuth') || content.includes('apiFetch') || content.includes('fetch(')) && !content.includes(`import { api } from '@/lib/api'`)) {
    content = `import { api } from '@/lib/api';\n` + content;
  }

  // Replace fetchWithAuth
  content = content.replace(/fetchWithAuth\(([^,]+)\)/g, 'api.get<any>($1)');
  content = content.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\)/g, 'api.delete<any>($1)');
  content = content.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'POST',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.post<any>($1, $2)');
  content = content.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'PATCH',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.patch<any>($1, $2)');
  content = content.replace(/fetchWithAuth\(([^,]+),\s*\{\s*method:\s*'PUT',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.put<any>($1, $2)');

  // For frontend apiFetch
  content = content.replace(/import \{ apiFetch \} from '[^']+';\n/g, '');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+)\)/g, 'api.get($1)');
  content = content.replace(/apiFetch(?:<[^>]+>)?\(([^,]+),\s*\{\s*method:\s*'POST',\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\)/g, 'api.post($1, $3)');

  // Replace raw fetch calls
  content = content.replace(/fetch\(\s*(?:`|')http:\/\/localhost:4000\/api([^`']+)(?:`|')\s*\)\.then\(([^)]+)\s*=>\s*\2\.json\(\)\)/g, 'api.get(\'$1\')');
  content = content.replace(/fetch\(\s*(?:`|')\/api([^`']+)(?:`|')\s*\)\.then\(([^)]+)\s*=>\s*\2\.json\(\)\)/g, 'api.get(\'$1\')');
  
  content = content.replace(/fetch\(\s*(?:`|')http:\/\/localhost:4000\/api([^`']+)(?:`|'),\s*\{\s*method:\s*'POST',\s*headers:[^}]+\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\s*\)/g, 'api.post(\'$1\', $2)');
  content = content.replace(/fetch\(\s*(?:`|')\/api([^`']+)(?:`|'),\s*\{\s*method:\s*'POST',\s*headers:[^}]+\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\s*\)/g, 'api.post(\'$1\', $2)');
  
  content = content.replace(/fetch\(\s*(?:`|')\$\{baseUrl\}\/api([^`']+)(?:`|'),\s*\{\s*method:\s*'POST',\s*headers:[^}]+\},\s*body:\s*JSON\.stringify\(([^)]+)\),?\s*\}\s*\)/g, 'api.post(\'$1\', $2)');
  content = content.replace(/fetch\(\s*(?:`|')\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api([^`']+)(?:`|')\s*\)\.then\(([^)]+)\s*=>\s*\2\.json\(\)\)/g, 'api.get(\'$1\')');
  
  // Specific cases
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/products\/brands`\s*\)\.then\(r => r\.json\(\)\)/g, "api.get('/products/brands')");
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/products\?limit=200`\s*\)\.then\(r => r\.json\(\)\)/g, "api.get('/products?limit=200')");
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/categories`\s*\)\.then\(r => r\.json\(\)\)/g, "api.get('/categories')");
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/orders\/customers\/search\?q=\$\{customerSearch\}`\s*\)\.then\(r => r\.json\(\)\)/g, "api.get(`/orders/customers/search?q=\${customerSearch}`)");
  
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/products\/\$\{id\}`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\s*\)\.then\(r => r\.json\(\)\)/g, "api.get(`/products/\${id}`)");
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/categories\/\$\{id\}`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\s*\)\.then\(r => r\.json\(\)\)/g, "api.get(`/categories/\${id}`)");
  content = content.replace(/fetch\(\s*`\$\{API_BASE\}\/api\/customers\/\$\{id\}`,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}\s*\)\.then\(r => r\.json\(\)\)/g, "api.get(`/customers/\${id}`)");
  
  content = content.replace(/const res = await fetch\(\s*`\$\{import\.meta\.env\.VITE_API_BASE_URL\}\/api\/auth\/login`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(values\)\s*\}\s*\)/g, "const res = await api.post('/auth/login', values)");

  content = content.replace(/const res = await fetch\('http:\/\/localhost:4000\/api\/auth\/telegram',\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(userData\)\s*\}\)/g, "const res = await api.post('/auth/telegram', userData)");

  content = content.replace(/return fetch\('http:\/\/localhost:4000\/api\/health'\)\.then\(\(r\) => \{\s*return r\.ok;/g, "return api.get('/health').then(() => { return true;").replace(/\}\)\.catch\(\(\) => false\);/g, "}).catch(() => false);");

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
      // Exclude lib/api.ts itself
      if (!fullPath.endsWith('lib/api.ts') && !fullPath.endsWith('lib/apiFetch.ts')) {
        processFile(fullPath);
      }
    }
  }
}

walkDir(adminDir);
walkDir(frontendDir);
