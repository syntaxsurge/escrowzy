#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route files with [id] or similar dynamic segments
const routeFiles = glob.sync('src/app/api/**/*.ts');

routeFiles.forEach(file => {
  // Check if file path contains dynamic segment pattern
  if (!file.includes('[') || !file.includes(']')) {
    return;
  }

  const content = fs.readFileSync(file, 'utf-8');
  let modified = false;
  let newContent = content;

  // Pattern 1: Fix function signatures with { params: { id: string } }
  const pattern1 = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g;
  if (pattern1.test(content)) {
    newContent = newContent.replace(pattern1, '{ params }: { params: Promise<{$1}> }');
    modified = true;
  }

  // Pattern 2: Fix params access - change params.id to await params then destructure
  const functionPattern = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{/g;
  const matches = [...newContent.matchAll(functionPattern)];
  
  for (const match of matches) {
    const funcStart = match.index + match[0].length;
    // Find the next few lines after function start
    const funcBody = newContent.slice(funcStart, funcStart + 500);
    
    // Check if params are accessed directly (e.g., params.id)
    if (funcBody.includes('params.') && !funcBody.includes('await params')) {
      // Find all param names being accessed
      const paramNames = new Set();
      const paramPattern = /params\.(\w+)/g;
      let paramMatch;
      while ((paramMatch = paramPattern.exec(funcBody)) !== null) {
        paramNames.add(paramMatch[1]);
      }
      
      if (paramNames.size > 0) {
        // Create destructuring statement
        const destructure = `\n  const { ${Array.from(paramNames).join(', ')} } = await params`;
        
        // Insert destructuring after try block or at function start
        const tryIndex = funcBody.indexOf('try {');
        if (tryIndex !== -1) {
          const insertPos = funcStart + tryIndex + 5;
          newContent = newContent.slice(0, insertPos) + destructure + newContent.slice(insertPos);
          
          // Replace all params.X with just X
          paramNames.forEach(name => {
            const regex = new RegExp(`params\\.${name}`, 'g');
            newContent = newContent.replace(regex, name);
          });
          
          modified = true;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(file, newContent);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Route params fix complete!');