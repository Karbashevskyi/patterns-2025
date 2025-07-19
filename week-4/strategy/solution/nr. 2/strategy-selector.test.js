import { selectStrategy } from '../nr. 1/strategy-selector.js';
import { RENDERERS } from './3-function-refactored.js';

function testStrategySelection() {
  console.log('\nTesting Strategy Selection...');
  
  // Test direct strategy selection
  const consoleStrategy = selectStrategy(RENDERERS, 'console');
  const webStrategy = selectStrategy(RENDERERS, 'web');
  const markdownStrategy = selectStrategy(RENDERERS, 'markdown');
  const abstractStrategy = selectStrategy(RENDERERS, 'nonexistent');
  
  if (typeof consoleStrategy === 'function') {
    console.log('✅ Console strategy selected correctly');
  } else {
    console.log('❌ Console strategy selection failed');
  }
  
  if (typeof webStrategy === 'function') {
    console.log('✅ Web strategy selected correctly');
  } else {
    console.log('❌ Web strategy selection failed');
  }
  
  if (typeof markdownStrategy === 'function') {
    console.log('✅ Markdown strategy selected correctly');
  } else {
    console.log('❌ Markdown strategy selection failed');
  }
  
  if (typeof abstractStrategy === 'function') {
    console.log('✅ Abstract fallback works correctly');
  } else {
    console.log('❌ Abstract fallback failed');
  }
}

console.log('🧪 Running tests for strategy-selector.js\n');

testStrategySelection();

console.log('\n✅ All tests completed!');