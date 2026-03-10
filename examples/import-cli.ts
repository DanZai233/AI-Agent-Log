#!/usr/bin/env node

/**
 * CLI Tool for importing conversations using plugins
 */

import pluginManager from '../plugins/plugin-system';
import { JSONImportPlugin } from '../plugins/importers/json-importer';
import { CursorHistoryPlugin } from '../plugins/importers/cursor-importer';
import { MarkdownImportPlugin } from '../plugins/importers/markdown-importer';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register plugins
pluginManager.registerImportPlugin(JSONImportPlugin);
pluginManager.registerImportPlugin(CursorHistoryPlugin);
pluginManager.registerImportPlugin(MarkdownImportPlugin);

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      listPlugins();
      break;
    case 'file':
      await importFile(args[1]);
      break;
    case 'text':
      await importText();
      break;
    case 'dir':
      await importDirectory(args[1]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
Agent Log Import Tool

Usage:
  node examples/import-cli.js <command> [arguments]

Commands:
  list                          List all available import plugins
  file <path>                   Import conversations from a file
  text                          Import conversations from text (pasted content)
  dir <path>                    Import all supported files from a directory

Examples:
  node examples/import-cli.js list
  node examples/import-cli.js file cursor-history.json
  node examples/import-cli.js text
  node examples/import-cli.js dir ~/Downloads/conversations

Supported file formats:
  - JSON files (.json, .jsonl)
  - Markdown files (.md)
  - Cursor history files
  `);
}

function listPlugins() {
  const plugins = pluginManager.getImportPlugins();
  
  console.log('\nAvailable Import Plugins:\n');
  
  for (const plugin of plugins) {
    console.log(`  ${plugin.name} v${plugin.version}`);
    console.log(`    ${plugin.description}`);
    if (plugin.author) {
      console.log(`    Author: ${plugin.author}`);
    }
    console.log('');
  }
}

async function importFile(filePath: string) {
  if (!filePath) {
    console.error('Error: File path is required');
    console.log('Usage: node examples/import-cli.js file <path>');
    process.exit(1);
  }
  
  try {
    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) {
      console.error(`Error: ${filePath} is not a file`);
      process.exit(1);
    }
    
    console.log(`\n📄 Importing from: ${filePath}\n`);
    
    const { plugin, result } = await pluginManager.importFromFile(filePath);
    
    console.log(`✅ Import complete using plugin: ${plugin}\n`);
    console.log(`   Imported: ${result.imported} conversations`);
    console.log(`   Skipped: ${result.skipped}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors:\n`);
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }
    
  } catch (error: any) {
    console.error(`❌ Import failed: ${error.message}`);
    process.exit(1);
  }
}

async function importText() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  console.log('\n📋 Paste your conversation text and press Ctrl+D when done:\n');
  
  let text = '';
  
  for await (const line of rl) {
    text += line + '\n';
  }
  
  rl.close();
  
  try {
    console.log('\n⏳ Importing...\n');
    
    const { plugin, result } = await pluginManager.importFromText(text);
    
    console.log(`✅ Import complete using plugin: ${plugin}\n`);
    console.log(`   Imported: ${result.imported} conversations`);
    console.log(`   Skipped: ${result.skipped}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors:\n`);
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }
    
  } catch (error: any) {
    console.error(`❌ Import failed: ${error.message}`);
    console.log('\n💡 Tip: Make sure your text follows one of the supported formats');
    console.log('   Run "node examples/import-cli.js list" to see available plugins');
    process.exit(1);
  }
}

async function importDirectory(dirPath: string) {
  if (!dirPath) {
    console.error('Error: Directory path is required');
    console.log('Usage: node examples/import-cli.js dir <path>');
    process.exit(1);
  }
  
  try {
    const stats = await fs.stat(dirPath);
    
    if (!stats.isDirectory()) {
      console.error(`Error: ${dirPath} is not a directory`);
      process.exit(1);
    }
    
    const files = await fs.readdir(dirPath);
    const importableFiles = files.filter(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      return ['json', 'jsonl', 'md', 'markdown'].includes(ext || '');
    });
    
    if (importableFiles.length === 0) {
      console.log(`\n⚠️  No importable files found in ${dirPath}`);
      process.exit(0);
    }
    
    console.log(`\n📂 Found ${importableFiles.length} importable files in ${dirPath}\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];
    
    for (const file of importableFiles) {
      const fullPath = join(dirPath, file);
      console.log(`📄 Processing: ${file}`);
      
      try {
        const { plugin, result } = await pluginManager.importFromFile(fullPath);
        console.log(`   ✅ Imported ${result.imported} conversations using ${plugin}`);
        
        totalImported += result.imported;
        totalSkipped += result.skipped;
        
        if (result.errors.length > 0) {
          allErrors.push(...result.errors.map(e => `${file}: ${e}`));
        }
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        allErrors.push(`${file}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total imported: ${totalImported} conversations`);
    console.log(`   Total skipped: ${totalSkipped}`);
    
    if (allErrors.length > 0) {
      console.log(`\n⚠️  Errors:\n`);
      for (const error of allErrors) {
        console.log(`   - ${error}`);
      }
    }
    
  } catch (error: any) {
    console.error(`❌ Import failed: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };