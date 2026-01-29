#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get folder path from command line argument
const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Usage: npm run release <folder-path>');
  console.error('Example: npm run release ./v1.0.0');
  process.exit(1);
}

// Resolve to absolute path
const absolutePath = path.resolve(folderPath);

// Check if folder exists
if (!fs.existsSync(absolutePath)) {
  console.error(`Error: Folder not found: ${absolutePath}`);
  process.exit(1);
}

// Check if it's a directory
if (!fs.statSync(absolutePath).isDirectory()) {
  console.error(`Error: ${absolutePath} is not a directory`);
  process.exit(1);
}

// Get folder name as release tag
const releaseTag = path.basename(absolutePath);

// Get all files in the folder (non-recursive)
const files = fs.readdirSync(absolutePath)
  .map(file => path.join(absolutePath, file))
  .filter(file => fs.statSync(file).isFile());

if (files.length === 0) {
  console.error(`Error: No files found in folder: ${absolutePath}`);
  process.exit(1);
}

console.log(`\n📦 Creating GitHub Release`);
console.log(`   Tag: ${releaseTag}`);
console.log(`   Mode: Draft`);
console.log(`   Files to upload: ${files.length}`);
files.forEach(file => console.log(`     - ${path.basename(file)}`));
console.log('');

// Build the gh release create command
// --draft creates it as a draft
// --title sets the release title (same as tag)
// --generate-notes auto-generates release notes from commits
const fileArgs = files.map(f => `"${f}"`).join(' ');
const command = `gh release create "${releaseTag}" ${fileArgs} --draft --title "${releaseTag}"`;

try {
  console.log('🚀 Creating release...\n');
  const output = execSync(command, {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'inherit']
  });

  console.log('✅ Release created successfully!');
  if (output.trim()) {
    console.log(`📎 URL: ${output.trim()}`);
  }
} catch (error) {
  console.error('❌ Failed to create release');
  if (error.message.includes('already exists')) {
    console.error(`   A release with tag "${releaseTag}" already exists.`);
    console.error('   Delete it first or use a different folder name.');
  }
  process.exit(1);
}
