import { createStrategy } from './strategy-module.js';

const agentStrategy = createStrategy('agent', ['notify', 'multicast']);

const registerAgent = (name, behaviour) => {
  agentStrategy.registerBehaviour(name, behaviour);
};

const getAgent = (name, action) => {
  return agentStrategy.getBehaviour(name, action);
};

// Usage

registerAgent('email', {
  notify: (to, message) => {
    console.log(`Sending "email" notification to <${to}>`);
    console.log(`message length: ${message.length}`);
  },
  multicast: (message) => {
    console.log(`Sending "email" notification to all`);
    console.log(`message length: ${message.length}`);
  },
});

registerAgent('sms', {
  notify: (to, message) => {
    console.log(`Sending "sms" notification to <${to}>`);
    console.log(`message length: ${message.length}`);
  },
  multicast: (message) => {
    console.log(`Sending "sms" notification to all`);
    console.log(`message length: ${message.length}`);
  },
});

registerAgent('push', {
  notify: (to, message) => {
    console.log(`Sending "push" notification to <${to}>`);
    console.log(`message length: ${message.length}`);
  },
  multicast: (message) => {
    console.log(`Sending "push" notification to all`);
    console.log(`message length: ${message.length}`);
  },
});

registerAgent('slack', {
  notify: (to, message) => {
    console.log(`Sending "slack" notification to <${to}>`);
    console.log(`message length: ${message.length}`);
  },
  multicast: (message) => {
    console.log(`Sending "slack" notification to all channels`);
    console.log(`message length: ${message.length}`);
  },
});

// Demo usage
console.log('=== Agent Strategy Demo ===');

const notify = getAgent('sms', 'notify');
notify('+380501234567', 'Hello world');

const emailMulticast = getAgent('email', 'multicast');
emailMulticast('System maintenance scheduled for tonight');

const pushNotify = getAgent('push', 'notify');
pushNotify('user123', 'You have a new message');

const slackMulticast = getAgent('slack', 'multicast');
slackMulticast('Deploy completed successfully');

console.log('\n✅ Agent strategy demo completed!');
