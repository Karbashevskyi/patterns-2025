import { context } from './3-function-refactored.js';

const testData = [
  { name: 'Marcus Aurelius', city: 'Rome', born: 121 },
  { name: 'Victor Glushkov', city: 'Rostov on Don', born: 1923 },
];

// Test functions
function testAbstractRenderer() {
  console.log('Testing Abstract Renderer...');
  const abstractRenderer = context('abstract');
  const result = abstractRenderer(testData);
  
  if (result === 'Not implemented') {
    console.log('✅ Abstract renderer returns correct message');
  } else {
    console.log('❌ Abstract renderer failed:', result);
  }
}

function testConsoleRenderer() {
  console.log('\nTesting Console Renderer...');
  const consoleRenderer = context('console');
  const result = consoleRenderer(testData);
  
  const expectedLines = [
    'name\tcity\tborn',
    'Marcus Aurelius\tRome\t121',
    'Victor Glushkov\tRostov on Don\t1923'
  ];
  const expected = expectedLines.join('\n');
  
  if (result === expected) {
    console.log('✅ Console renderer formats data correctly');
  } else {
    console.log('❌ Console renderer failed');
    console.log('Expected:', expected);
    console.log('Got:', result);
  }
}

function testWebRenderer() {
  console.log('\nTesting Web Renderer...');
  const webRenderer = context('web');
  const result = webRenderer(testData);
  
  const expected = '<table><tr><th>name</th><th>city</th><th>born</th></tr>' +
    '<tr><td>Marcus Aurelius</td><td>Rome</td><td>121</td></tr>' +
    '<tr><td>Victor Glushkov</td><td>Rostov on Don</td><td>1923</td></tr>' +
    '</table>';
  
  if (result === expected) {
    console.log('✅ Web renderer generates correct HTML');
  } else {
    console.log('❌ Web renderer failed');
    console.log('Expected:', expected);
    console.log('Got:', result);
  }
}

function testMarkdownRenderer() {
  console.log('\nTesting Markdown Renderer...');
  const markdownRenderer = context('markdown');
  const result = markdownRenderer(testData);
  
  const expectedLines = [
    '|name|city|born|',
    '|---|---|---|',
    '|Marcus Aurelius|Rome|121|',
    '|Victor Glushkov|Rostov on Don|1923|'
  ];
  const expected = expectedLines.join('\n');
  
  if (result === expected) {
    console.log('✅ Markdown renderer formats table correctly');
  } else {
    console.log('❌ Markdown renderer failed');
    console.log('Expected:', expected);
    console.log('Got:', result);
  }
}

function testUnknownRenderer() {
  console.log('\nTesting Unknown Renderer (should use abstract)...');
  const unknownRenderer = context('png');
  const result = unknownRenderer(testData);
  
  if (result === 'Not implemented') {
    console.log('✅ Unknown renderer falls back to abstract');
  } else {
    console.log('❌ Unknown renderer failed to fall back:', result);
  }
}

function testContextFunction() {
  console.log('\nTesting Context Function...');
  
  // Test that context returns a function
  const renderer = context('console');
  if (typeof renderer === 'function') {
    console.log('✅ Context returns a function');
  } else {
    console.log('❌ Context should return a function');
  }
  
  // Test that the returned function works
  const result = renderer(testData);
  if (typeof result === 'string') {
    console.log('✅ Context function executes renderer correctly');
  } else {
    console.log('❌ Context function should return a string');
  }
}

function testEmptyData() {
  console.log('\nTesting Edge Cases...');
  
  // Test with single item
  const singleItem = [{ name: 'Test', value: 123 }];
  const consoleRenderer = context('console');
  const result = consoleRenderer(singleItem);
  
  if (result === 'name\tvalue\nTest\t123') {
    console.log('✅ Single item rendering works');
  } else {
    console.log('❌ Single item rendering failed:', result);
  }
  
  // Test with different data structure
  const differentData = [
    { id: 1, status: 'active' },
    { id: 2, status: 'inactive' }
  ];
  const webRenderer = context('web');
  const webResult = webRenderer(differentData);
  
  if (webResult.includes('<th>id</th>') && webResult.includes('<th>status</th>')) {
    console.log('✅ Different data structure rendering works');
  } else {
    console.log('❌ Different data structure rendering failed');
  }
}

// Run all tests
console.log('🧪 Running tests for 3-function-refactored.js\n');

testAbstractRenderer();
testConsoleRenderer();
testWebRenderer();
testMarkdownRenderer();
testUnknownRenderer();
testContextFunction();
testEmptyData();

console.log('\n✅ All tests completed!');
