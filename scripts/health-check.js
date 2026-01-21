#!/usr/bin/env node
/**
 * Health Check Script
 * Monitors Next.js dev server logs and automatically logs issues to TODO.md
 * Run alongside: npm run dev
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TODO_FILE = path.join(__dirname, '..', 'TODO.md');
const LOG_FILE = path.join(__dirname, '..', '.health-check.log');

// Issue patterns to detect
const ISSUE_PATTERNS = {
  image404: {
    pattern: /GET (\/breeds\/[a-z]+\.jpg) 404/i,
    severity: 'Low',
    status: 'Non-critical',
    category: 'Missing Resources',
  },
  invalidImage: {
    pattern: /⨯ The requested resource isn't a valid image for (\/breeds\/[a-z]+\.jpg)/i,
    severity: 'Low',
    status: 'Non-critical',
    category: 'Invalid Resources',
  },
  compilationError: {
    pattern: /⨯ (.*error.*)/i,
    severity: 'High',
    status: 'Critical',
    category: 'Compilation Error',
  },
  apiError: {
    pattern: /GET (\/api\/\S+) (4\d\d|5\d\d)/,
    severity: 'Medium',
    status: 'API Issue',
    category: 'API Error',
  },
  hydrationError: {
    pattern: /hydration/i,
    severity: 'High',
    status: 'Critical',
    category: 'React Hydration',
  },
};

class IssueTracker {
  constructor() {
    this.detectedIssues = new Map();
    this.logBuffer = [];
  }

  processLine(line) {
    // Check for image 404s
    const image404Match = line.match(ISSUE_PATTERNS.image404.pattern);
    if (image404Match) {
      const resource = image404Match[1];
      const issueKey = `image-404-${resource}`;
      
      if (!this.detectedIssues.has(issueKey)) {
        this.detectedIssues.set(issueKey, {
          type: 'Missing Placeholder Image',
          resource,
          severity: ISSUE_PATTERNS.image404.severity,
          status: ISSUE_PATTERNS.image404.status,
          firstSeen: new Date().toISOString(),
          count: 1,
        });
        console.log(`\x1b[33m⚠ DETECTED: Missing image ${resource}\x1b[0m`);
      } else {
        this.detectedIssues.get(issueKey).count++;
      }
    }

    // Check for invalid images
    const invalidImageMatch = line.match(ISSUE_PATTERNS.invalidImage.pattern);
    if (invalidImageMatch) {
      const resource = invalidImageMatch[1];
      const issueKey = `invalid-image-${resource}`;
      
      if (!this.detectedIssues.has(issueKey)) {
        this.detectedIssues.set(issueKey, {
          type: 'Invalid Image Resource',
          resource,
          severity: ISSUE_PATTERNS.invalidImage.severity,
          status: ISSUE_PATTERNS.invalidImage.status,
          firstSeen: new Date().toISOString(),
          count: 1,
        });
      } else {
        this.detectedIssues.get(issueKey).count++;
      }
    }

    // Check for API errors
    const apiErrorMatch = line.match(ISSUE_PATTERNS.apiError.pattern);
    if (apiErrorMatch) {
      const endpoint = apiErrorMatch[1];
      const statusCode = apiErrorMatch[2];
      const issueKey = `api-error-${endpoint}-${statusCode}`;
      
      if (!this.detectedIssues.has(issueKey)) {
        this.detectedIssues.set(issueKey, {
          type: 'API Error',
          endpoint,
          statusCode,
          severity: ISSUE_PATTERNS.apiError.severity,
          status: ISSUE_PATTERNS.apiError.status,
          firstSeen: new Date().toISOString(),
          count: 1,
        });
        console.log(`\x1b[31m✗ DETECTED: API error ${endpoint} returned ${statusCode}\x1b[0m`);
      } else {
        this.detectedIssues.get(issueKey).count++;
      }
    }

    // Check for hydration errors
    if (ISSUE_PATTERNS.hydrationError.pattern.test(line)) {
      const issueKey = 'hydration-mismatch';
      
      if (!this.detectedIssues.has(issueKey)) {
        this.detectedIssues.set(issueKey, {
          type: 'React Hydration Mismatch',
          severity: ISSUE_PATTERNS.hydrationError.severity,
          status: ISSUE_PATTERNS.hydrationError.status,
          firstSeen: new Date().toISOString(),
          count: 1,
          line: line.trim(),
        });
        console.log(`\x1b[31m✗ DETECTED: Hydration error\x1b[0m`);
      } else {
        this.detectedIssues.get(issueKey).count++;
      }
    }

    // Log successful operations
    if (line.includes('✓ Ready in')) {
      console.log(`\x1b[32m✓ Server ready\x1b[0m`);
    }
    if (line.match(/GET \/ 200/)) {
      console.log(`\x1b[32m✓ Page loaded successfully\x1b[0m`);
    }
    if (line.includes('LLM Router initialized')) {
      console.log(`\x1b[32m✓ LLM Router ready\x1b[0m`);
    }
  }

  generateReport() {
    if (this.detectedIssues.size === 0) {
      return '\n\x1b[32m✓ No new issues detected\x1b[0m\n';
    }

    let report = '\n\x1b[33m═══════════════════════════════════════════\x1b[0m\n';
    report += '\x1b[33m  HEALTH CHECK REPORT\x1b[0m\n';
    report += '\x1b[33m═══════════════════════════════════════════\x1b[0m\n\n';

    const issuesByCategory = new Map();
    
    for (const [key, issue] of this.detectedIssues) {
      const category = issue.type;
      if (!issuesByCategory.has(category)) {
        issuesByCategory.set(category, []);
      }
      issuesByCategory.get(category).push({ key, ...issue });
    }

    for (const [category, issues] of issuesByCategory) {
      const severityColor = issues[0].severity === 'High' ? '\x1b[31m' : 
                           issues[0].severity === 'Medium' ? '\x1b[33m' : '\x1b[36m';
      
      report += `${severityColor}${category}:\x1b[0m\n`;
      
      for (const issue of issues) {
        report += `  • ${issue.resource || issue.endpoint || issue.line || 'N/A'}\n`;
        report += `    Count: ${issue.count}, Severity: ${issue.severity}\n`;
      }
      report += '\n';
    }

    report += '\x1b[33m═══════════════════════════════════════════\x1b[0m\n';
    return report;
  }

  async updateTodoFile() {
    if (this.detectedIssues.size === 0) return;

    try {
      let todoContent = fs.readFileSync(TODO_FILE, 'utf-8');
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Check if "Auto-Detected Issues" section exists
      if (!todoContent.includes('## Auto-Detected Issues')) {
        // Add new section after "Known Issues"
        const insertPoint = todoContent.indexOf('## Known Issues - To Be Addressed Later');
        if (insertPoint !== -1) {
          const beforeSection = todoContent.substring(0, insertPoint);
          const afterSection = todoContent.substring(insertPoint);
          
          todoContent = beforeSection + 
            `## Auto-Detected Issues (from Health Check)\n` +
            `_Last scan: ${today}_\n\n` +
            `---\n\n` +
            afterSection;
        }
      }

      // Add new issues to the Auto-Detected section
      const issueEntries = [];
      
      for (const [key, issue] of this.detectedIssues) {
        const issueText = `### ${issue.type}\n` +
          `- **Status**: ${issue.status}\n` +
          `- **Severity**: ${issue.severity}\n` +
          `- **Resource**: ${issue.resource || issue.endpoint || 'N/A'}\n` +
          `- **First Detected**: ${issue.firstSeen}\n` +
          `- **Occurrences**: ${issue.count}\n` +
          (issue.line ? `- **Details**: \`${issue.line}\`\n` : '') +
          `- **Auto-detected**: Yes\n\n`;
        
        // Only add if not already in TODO
        if (!todoContent.includes(issue.resource || issue.endpoint || key)) {
          issueEntries.push(issueText);
        }
      }

      if (issueEntries.length > 0) {
        // Insert new issues after "Auto-Detected Issues" header
        const autoDetectIndex = todoContent.indexOf('## Auto-Detected Issues');
        if (autoDetectIndex !== -1) {
          const nextSectionIndex = todoContent.indexOf('\n## ', autoDetectIndex + 1);
          const insertAt = nextSectionIndex !== -1 ? nextSectionIndex : todoContent.length;
          
          todoContent = todoContent.substring(0, insertAt) + 
            '\n' + issueEntries.join('') +
            (nextSectionIndex !== -1 ? todoContent.substring(insertAt) : '');
          
          fs.writeFileSync(TODO_FILE, todoContent);
          console.log(`\x1b[32m✓ Updated TODO.md with ${issueEntries.length} new issues\x1b[0m`);
        }
      }
    } catch (error) {
      console.error('\x1b[31m✗ Failed to update TODO.md:\x1b[0m', error.message);
    }
  }
}

// Main execution
console.log('\x1b[36m════════════════════════════════════════\x1b[0m');
console.log('\x1b[36m  🏥 Health Check Monitor Started\x1b[0m');
console.log('\x1b[36m════════════════════════════════════════\x1b[0m\n');

const tracker = new IssueTracker();
let lineBuffer = '';

// Monitor stdin from piped npm run dev
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  lineBuffer += chunk;
  const lines = lineBuffer.split('\n');
  lineBuffer = lines.pop() || '';
  
  lines.forEach(line => {
    if (line.trim()) {
      tracker.processLine(line);
      // Log to file
      fs.appendFileSync(LOG_FILE, line + '\n');
    }
  });
});

// Generate report on exit
process.on('SIGINT', async () => {
  console.log(tracker.generateReport());
  await tracker.updateTodoFile();
  process.exit(0);
});

process.on('exit', () => {
  console.log('\n\x1b[36m🏥 Health Check Monitor Stopped\x1b[0m\n');
});
