/**
 * Week 9: Comparison Demo
 * 
 * Run all three approaches and compare:
 * 1. Enterprise (over-engineered)
 * 2. Pragmatic (too simple)
 * 3. Balanced (best of both)
 */

import { enterpriseExample } from './enterprise.js';
import { pragmaticExample } from './pragmatic.js';
import { balancedExample } from './balanced.js';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Week 9: Expressive DSLs - Three Approaches Comparison    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Run Enterprise approach
  await enterpriseExample();
  console.log('\n' + '═'.repeat(60) + '\n');

  // Run Pragmatic approach
  await pragmaticExample();
  console.log('\n' + '═'.repeat(60) + '\n');

  // Run Balanced approach
  await balancedExample();
  console.log('\n' + '═'.repeat(60) + '\n');

  // Final comparison
  printComparison();
}

function printComparison() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL COMPARISON                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const comparison = [
    {
      aspect: 'Readability',
      enterprise: '❌ Poor - Too many layers',
      pragmatic: '✅ Excellent - Very clear',
      balanced: '✅ Excellent - Clear and organized',
    },
    {
      aspect: 'Maintainability',
      enterprise: '⚠️  Mixed - Easy to modify but hard to understand',
      pragmatic: '❌ Poor - Mixed concerns',
      balanced: '✅ Good - Clear boundaries',
    },
    {
      aspect: 'Testability',
      enterprise: '✅ Excellent - Everything isolated',
      pragmatic: '❌ Poor - Hard to test in isolation',
      balanced: '✅ Good - Components are testable',
    },
    {
      aspect: 'Expressiveness',
      enterprise: '❌ Poor - Lost in abstraction',
      pragmatic: '✅ Excellent - Natural language',
      balanced: '✅ Excellent - Fluent API',
    },
    {
      aspect: 'Complexity',
      enterprise: '❌ Very High - 15+ files, 500+ LOC',
      pragmatic: '✅ Low - 1 file, 300 LOC',
      balanced: '✅ Moderate - 1-2 files, 400 LOC',
    },
    {
      aspect: 'Separation of Concerns',
      enterprise: '✅ Perfect - Everything separated',
      pragmatic: '❌ Poor - Everything mixed',
      balanced: '✅ Good - Clear responsibilities',
    },
    {
      aspect: 'Single Responsibility',
      enterprise: '✅ Perfect - One class = one job',
      pragmatic: '❌ Violated - Query class does everything',
      balanced: '✅ Good - Clear responsibilities',
    },
    {
      aspect: 'Learning Curve',
      enterprise: '❌ Steep - Need to understand many concepts',
      pragmatic: '✅ Easy - Just use it',
      balanced: '✅ Moderate - Intuitive with structure',
    },
    {
      aspect: 'Extension',
      enterprise: '✅ Easy - Add new factory/strategy',
      pragmatic: '❌ Hard - Need to modify existing class',
      balanced: '✅ Easy - Add new component',
    },
    {
      aspect: 'Business Logic Visibility',
      enterprise: '❌ Hidden - Buried in abstractions',
      pragmatic: '✅ Clear - Direct implementation',
      balanced: '✅ Clear - Fluent API shows intent',
    },
  ];

  // Print table
  console.log('┌─────────────────────────┬──────────────────────────┬──────────────────────────┬──────────────────────────┐');
  console.log('│ Aspect                  │ Enterprise               │ Pragmatic                │ Balanced                 │');
  console.log('├─────────────────────────┼──────────────────────────┼──────────────────────────┼──────────────────────────┤');

  comparison.forEach(row => {
    console.log(`│ ${pad(row.aspect, 23)} │ ${pad(row.enterprise, 24)} │ ${pad(row.pragmatic, 24)} │ ${pad(row.balanced, 24)} │`);
  });

  console.log('└─────────────────────────┴──────────────────────────┴──────────────────────────┴──────────────────────────┘\n');

  // Summary scores
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                      SUMMARY SCORES                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('Enterprise Approach:');
  console.log('  ✅ Pros: Testability, SoC, SRP, Extension');
  console.log('  ❌ Cons: Readability, Complexity, Learning curve, Visibility');
  console.log('  📊 Score: 4/10 - Over-engineered for most use cases\n');

  console.log('Pragmatic Approach:');
  console.log('  ✅ Pros: Readability, Expressiveness, Simplicity, Learning curve');
  console.log('  ❌ Cons: Maintainability, Testability, SoC, SRP, Extension');
  console.log('  📊 Score: 6/10 - Good for prototypes, bad for production\n');

  console.log('Balanced Approach:');
  console.log('  ✅ Pros: ALL of Pragmatic\'s readability + Enterprise\'s structure');
  console.log('  ❌ Cons: Slightly more code than Pragmatic');
  console.log('  📊 Score: 9/10 - Best of both worlds! ⭐\n');

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                      RECOMMENDATION                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('Use BALANCED approach because:');
  console.log('  1. Expressive DSL keeps code readable');
  console.log('  2. Clear responsibilities make it maintainable');
  console.log('  3. Components are testable in isolation');
  console.log('  4. Easy to extend without breaking existing code');
  console.log('  5. No unnecessary abstractions (YAGNI principle)');
  console.log('  6. Business logic is clear and visible');
  console.log('  7. Strikes perfect balance between simplicity and structure\n');

  console.log('When to deviate:');
  console.log('  - Use PRAGMATIC for: Prototypes, scripts, one-off tasks');
  console.log('  - Use ENTERPRISE for: Huge teams, complex domains with many variations\n');
}

function pad(str, length) {
  const clean = str.replace(/[✅❌⚠️]/g, '').trim();
  const emoji = str.match(/[✅❌⚠️]/)?.[0] || '';
  const needed = length - clean.length - emoji.length;
  return emoji + clean + ' '.repeat(Math.max(0, needed));
}

// Run the comparison
main().catch(console.error);
