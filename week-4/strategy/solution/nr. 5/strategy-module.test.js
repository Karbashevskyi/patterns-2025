import { createStrategy, getStrategy, getStrategies } from './strategy-module.js';

function testStrategyModule() {
  console.log('Testing Strategy Module...');
  
  const notificationStrategy = createStrategy('notification', ['notify', 'multicast']);
  
  notificationStrategy.registerBehaviour('email', {
    notify: (to, message) => `📧 Email to ${to}: ${message}`,
    multicast: (message) => `📧 Email broadcast: ${message}`
  });
  
  notificationStrategy.registerBehaviour('sms', {
    notify: (to, message) => `📱 SMS to ${to}: ${message}`,
    multicast: (message) => `📱 SMS broadcast: ${message}`
  });
  
  notificationStrategy.registerBehaviour('push', {
    notify: (to, message) => `🔔 Push to ${to}: ${message}`,
    multicast: (message) => `🔔 Push broadcast: ${message}`
  });
  
  const renderingStrategy = createStrategy('rendering', ['render', 'format']);
  
  renderingStrategy.registerBehaviour('html', {
    render: (data) => `<div>${JSON.stringify(data)}</div>`,
    format: (data) => `HTML: ${data}`
  });
  
  renderingStrategy.registerBehaviour('markdown', {
    render: (data) => `**${JSON.stringify(data)}**`,
    format: (data) => `MD: ${data}`
  });
  
  console.log('✅ Strategies created:', getStrategies());
  
  const emailNotify = notificationStrategy.getBehaviour('email', 'notify');
  const smsMulticast = notificationStrategy.getBehaviour('sms', 'multicast');
  const pushNotify = notificationStrategy.getBehaviour('push', 'notify');
  
  console.log('✅', emailNotify('user@example.com', 'Welcome!'));
  console.log('✅', smsMulticast('System maintenance in 1 hour'));
  console.log('✅', pushNotify('user123', 'You have a new message'));
  
  const htmlRender = renderingStrategy.getBehaviour('html', 'render');
  const markdownFormat = renderingStrategy.getBehaviour('markdown', 'format');
  
  console.log('✅', htmlRender({ title: 'Hello World' }));
  console.log('✅', markdownFormat('Important message'));
  
  const retrievedNotificationStrategy = getStrategy('notification');
  const retrievedEmailNotify = retrievedNotificationStrategy.getBehaviour('email', 'notify');
  console.log('✅ Retrieved strategy works:', retrievedEmailNotify('test@test.com', 'Test'));
  
  try {
    notificationStrategy.getBehaviour('telegram', 'notify');
    console.log('❌ Should have thrown error for unregistered implementation');
  } catch (error) {
    console.log('✅ Correctly threw error for unregistered implementation');
  }
  
  try {
    notificationStrategy.getBehaviour('email', 'send');
    console.log('❌ Should have thrown error for unsupported action');
  } catch (error) {
    console.log('✅ Correctly threw error for unsupported action');
  }
  
  try {
    getStrategy('nonexistent');
    console.log('❌ Should have thrown error for nonexistent strategy');
  } catch (error) {
    console.log('✅ Correctly threw error for nonexistent strategy');
  }
}

function testAgentExample() {
  console.log('\nTesting Agent Example with new Strategy Module...');
  
  const agentStrategy = createStrategy('agent', ['notify', 'multicast']);
  
  agentStrategy.registerBehaviour('email', {
    notify: (to, message) => {
      console.log(`Sending "email" notification to <${to}>`);
      console.log(`message length: ${message.length}`);
      return `Email sent to ${to}`;
    },
    multicast: (message) => {
      console.log(`Sending "email" notification to all`);
      console.log(`message length: ${message.length}`);
      return `Email broadcast sent`;
    },
  });
  
  agentStrategy.registerBehaviour('sms', {
    notify: (to, message) => {
      console.log(`Sending "sms" notification to <${to}>`);
      console.log(`message length: ${message.length}`);
      return `SMS sent to ${to}`;
    },
    multicast: (message) => {
      console.log(`Sending "sms" notification to all`);
      console.log(`message length: ${message.length}`);
      return `SMS broadcast sent`;
    },
  });
  
  const notify = agentStrategy.getBehaviour('sms', 'notify');
  notify('+380501234567', 'Hello world');
  
  const emailMulticast = agentStrategy.getBehaviour('email', 'multicast');
  emailMulticast('System update completed');
}

// Run tests
testStrategyModule();
testAgentExample();

console.log('\n✅ All module tests completed!');
