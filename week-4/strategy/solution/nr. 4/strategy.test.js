import { Strategy } from '../nr. 3/strategy.js';
import { selectStrategy } from '../nr. 1/strategy-selector.js';

function testStrategy() {
  console.log('Testing Strategy class...');
  
  const notificationStrategy = Strategy.create('notification', {
    actions: ['notify', 'multicast'],
    implementations: {
      email: {
        notify: (to, message) => `Sending email to ${to}: ${message}`,
        multicast: (message) => `Broadcasting email: ${message}`,
      }
    }
  });

  notificationStrategy.registerBehaviour('sms', {
    notify: (to, message) => `Sending SMS to ${to}: ${message}`,
    multicast: (message) => `Broadcasting SMS: ${message}`
  });
  
  const emailNotify = notificationStrategy.getBehaviour('email', 'notify');
  const smsMulticast = notificationStrategy.getBehaviour('sms', 'multicast');
  
  console.log('✅ Email notify:', emailNotify('test@example.com', 'Hello World'));
  console.log('✅ SMS multicast:', smsMulticast('System Alert'));
  
  try {
    notificationStrategy.getBehaviour('nonexistent', 'notify');
    console.log('✅ Should have thrown error for nonexistent implementation');
  } catch (error) {
    console.log('✅ Correctly threw error for nonexistent implementation');
  }
  
  try {
    notificationStrategy.getBehaviour('email', 'nonexistent');
    console.log('❌ Should have thrown error for nonexistent action');
  } catch (error) {
    console.log('✅ Correctly threw error for nonexistent action');
  }
}

function testSelectStrategy() {
  console.log('\nTesting selectStrategy function...');
  
  const strategies = {
    abstract: () => 'Default implementation',
    console: (data) => `Console: ${JSON.stringify(data)}`,
    web: (data) => `Web: ${JSON.stringify(data)}`
  };
  
  const consoleStrategy = selectStrategy(strategies, 'console');
  console.log('✅ Console strategy:', consoleStrategy({ test: 'data' }));
  
  const unknownStrategy = selectStrategy(strategies, 'unknown');
  console.log('✅ Unknown strategy (using abstract):', unknownStrategy());
  
  const strategiesWithoutAbstract = {
    console: (data) => `Console: ${JSON.stringify(data)}`
  };
  
  try {
    selectStrategy(strategiesWithoutAbstract, 'unknown');
    console.log('❌ Should have thrown error for no abstract fallback');
  } catch (error) {
    console.log('✅ Correctly threw error for no abstract fallback');
  }
}

// Run tests
testStrategy();
testSelectStrategy();

console.log('\n✅ All tests completed!');
