import { Strategy } from '../nr. 3/strategy.js';

/**
 * Цей файл підготовлений за допомогою ШІ Claude Sonnet 4 на базі файлу strategy.d.ts.
 * Цей файл всього лише демонструє, як використовувати Strategy в typescript 
 * коли програміст може використовувати 'as const' для використання літеральних типів в інших місцях.
 */

// Example 1: With 'as const' - preserves literal types
const strategyWithLiterals = Strategy.create('test', {
  actions: ['action1', 'action2', '123'] as const,
  implementations: {
    impl1: {
      action1: () => 'Action 1 from impl1',
      action2: () => 'Action 2 from impl1',
      '123': () => 'Action 123 from impl1'
    }
  }
});

// Now TypeScript will show:
// Strategy<["action1", "action2", "123"]>
// And getBehaviour will only accept 'action1' | 'action2' | '123'

// Example 2: Without 'as const' - widens to string[]
const strategyWithoutLiterals = Strategy.create('test2', {
  actions: ['notify', 'multicast'], // This becomes string[]
  implementations: {
    email: {
      notify: () => 'notify',
      multicast: () => 'multicast'
    }
  }
});

// This will show: Strategy<string[]>

// Example 3: Using Strategy.create with literals
const createdStrategy = Strategy.create('created', {
  actions: ['send', 'broadcast'] as const,
  implementations: {
    email: {
      send: (to: string) => `Email to ${to}`,
      broadcast: (msg: string) => `Broadcast: ${msg}`
    }
  }
});

// This will show: Strategy<["send", "broadcast"]>

// Test type safety
const emailSend = createdStrategy.getBehaviour('email', 'send'); // ✅ OK
// const emailInvalid = createdStrategy.getBehaviour('email', 'invalid'); // ❌ Error

export { strategyWithLiterals, strategyWithoutLiterals, createdStrategy };
