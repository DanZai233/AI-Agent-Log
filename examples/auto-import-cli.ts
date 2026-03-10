#!/usr/bin/env node

/**
 * CLI Tool to auto-detect and import conversations from AI coding tools
 */

import AutoImporter from '../plugins/auto-importer';
import { createInterface } from 'readline';

const importer = new AutoImporter();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';

  console.log('\n🤖 AI Agent Log - Auto Importer\n');
  console.log('═════════════════════════════════════\n');

  switch (command) {
    case 'scan':
      await scanTools();
      break;
    case 'import':
      await importTool(args[1]);
      break;
    case 'all':
      await importAll();
      break;
    case 'list':
      await listTools();
      break;
    default:
      if (command.startsWith('--help') || command === '-h') {
        printHelp();
      } else {
        console.error(`❌ Unknown command: ${command}\n`);
        printHelp();
      }
  }
}

async function listTools() {
  console.log('Supported AI Coding Tools:\n');

  const allTools = [
    { name: 'cursor', displayName: 'Cursor' },
    { name: 'claude-code', displayName: 'ClaudeCode / Claude Desktop' },
    { name: 'opencode', displayName: 'OpenCode' },
    { name: 'vscode-copilot', displayName: 'VS Code Copilot' },
  ];

  for (const tool of allTools) {
    console.log(`  ${tool.name.padEnd(20)} - ${tool.displayName}`);
  }

  console.log(`\nCommands:
  scan              - Scan for installed tools
  import <tool>     - Import from specific tool
  all               - Import from all installed tools
  list              - List all supported tools
  `);
}

async function scanTools() {
  console.log('🔍 Scanning for installed AI coding tools...\n');

  try {
    const installed = await importer.scanInstalledTools();

    if (installed.length === 0) {
      console.log('⚠️  No AI coding tools detected.\n');
      console.log('💡 Tip: Make sure you have used at least one of the following:');
      console.log('   - Cursor');
      console.log('   - ClaudeCode / Claude Desktop');
      console.log('   - OpenCode');
      console.log('   - VS Code with Copilot\n');
      return;
    }

    console.log(`✅ Found ${installed.length} tool(s):\n`);

    for (const tool of installed) {
      const dataPath = await importer.getToolDataPath(tool.name);
      console.log(`  ✓ ${tool.displayName}`);
      console.log(`    📁 ${dataPath}\n`);
    }

    console.log('To import conversations, run:\n');
    console.log('  # Import from all tools');
    console.log('  npm run import all\n');
    console.log('  # Import from specific tool');
    console.log('  npm run import import cursor\n');

  } catch (error: any) {
    console.error(`❌ Scan failed: ${error.message}`);
  }
}

async function importTool(toolName: string) {
  if (!toolName) {
    console.error('❌ Error: Please specify a tool name\n');
    console.log('Usage: npm run import import <tool-name>\n');
    console.log('Available tools:');
    await listTools();
    process.exit(1);
  }

  console.log(`📥 Starting import from ${toolName}...\n`);

  try {
    const result = await importer.importFromTool(toolName);

    console.log('\n' + '═'.repeat(50));
    console.log('📊 Import Summary\n');
    console.log(`   Tool: ${result.tool}`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Imported: ${result.imported} conversations`);

    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      if (result.errors.length <= 5) {
        result.errors.forEach(err => console.log(`     - ${err}`));
      } else {
        console.log(`     (showing first 5 of ${result.errors.length} errors)`);
        result.errors.slice(0, 5).forEach(err => console.log(`     - ${err}`));
      }
    }

    console.log('\n' + '═'.repeat(50));

    if (result.imported > 0) {
      console.log('\n✨ Done! You can now view your conversations at:');
      console.log('   http://localhost:3000\n');
    }

  } catch (error: any) {
    console.error(`\n❌ Import failed: ${error.message}`);
    console.log('\n💡 Tip: Make sure the Agent Log server is running:');
    console.log('   npm run dev\n');
  }
}

async function importAll() {
  console.log('🔄 Importing from all installed tools...\n');

  try {
    const installed = await importer.scanInstalledTools();

    if (installed.length === 0) {
      console.log('⚠️  No AI coding tools found to import.\n');
      return;
    }

    console.log(`Found ${installed.length} tool(s) to import from:\n`);

    const results = [];

    for (const tool of installed) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`Importing from ${tool.displayName}...`);
      console.log('─'.repeat(50));

      try {
        const result = await importer.importFromTool(tool.name);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          tool: tool.displayName,
          imported: 0,
          errors: [error.message],
        });
      }
    }

    // Print summary
    console.log('\n\n' + '═'.repeat(50));
    console.log('📊 Overall Import Summary\n');

    let totalImported = 0;
    let totalErrors = 0;

    for (const result of results) {
      totalImported += result.imported;
      totalErrors += result.errors.length;

      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.tool.padEnd(30)} ${result.imported} conversations`);
    }

    console.log('\n' + '─'.repeat(50));
    console.log(`Total imported: ${totalImported} conversations`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('═'.repeat(50) + '\n');

    if (totalImported > 0) {
      console.log('✨ All done! View your conversations at:');
      console.log('   http://localhost:3000\n');
    }

  } catch (error: any) {
    console.error(`\n❌ Import failed: ${error.message}`);
  }
}

function printHelp() {
  console.log(`
AI Agent Log - Auto Importer
─────────────────────────────

Automatically detect and import conversations from AI coding tools.

Usage:
  npm run import <command> [arguments]

Commands:
  scan              Scan for installed AI coding tools
  import <tool>     Import conversations from a specific tool
  all                Import from all installed tools
  list               List all supported tools
  --help, -h        Show this help message

Supported Tools:
  cursor            Cursor AI Editor
  claude-code        ClaudeCode / Claude Desktop
  opencode           OpenCode
  vscode-copilot     VS Code with GitHub Copilot

Examples:
  # Scan for installed tools
  npm run import scan

  # Import from Cursor
  npm run import import cursor

  # Import from all tools
  npm run import all

Environment Variables:
  AGENT_LOG_URL      Agent Log server URL (default: http://localhost:3000/api/logs)

Notes:
  • Make sure the Agent Log server is running before importing
  • Import may take a few minutes for large conversation histories
  • Only the most recent 500 conversations per tool are imported
`);
}

// Run
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, scanTools, importTool, importAll };