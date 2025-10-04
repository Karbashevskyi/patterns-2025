const STRATEGIES = new Map();

/**
 * Create a strategy with closure-based implementation
 * @param {string} strategyName - Name of the strategy
 * @param {string[]} actions - Array of action names
 * @returns {Object} Strategy interface with registerBehaviour and getBehaviour
 */
export const createStrategy = (strategyName, actions) => {
  if (typeof strategyName !== 'string') {
    throw new Error('Strategy name expected to be string');
  }
  if (!Array.isArray(actions)) {
    throw new Error('Actions expected to be array');
  }

  const implementations = new Map();

  const strategy = {
    /**
     * Register a behaviour implementation
     * @param {string} implementationName - Name of the implementation
     * @param {Object} behaviour - Object containing action implementations
     */
    registerBehaviour(implementationName, behaviour) {
      if (typeof implementationName !== 'string') {
        throw new Error('Implementation name expected to be string');
      }
      if (typeof behaviour !== 'object' || behaviour === null) {
        throw new Error('Behaviour expected to be object');
      }

      for (const action of actions) {
        if (typeof behaviour[action] !== 'function') {
          throw new Error(`Action "${action}" expected to be function in behaviour`);
        }
      }

      implementations.set(implementationName, behaviour);
    },

    /**
     * Get behaviour implementation for specific action
     * @param {string} implementationName - Name of the implementation
     * @param {string} actionName - Name of the action
     * @returns {Function} Action handler function
     */
    getBehaviour(implementationName, actionName) {
      if (!actions.includes(actionName)) {
        throw new Error(`Action "${actionName}" is not supported by strategy "${strategyName}"`);
      }

      const behaviour = implementations.get(implementationName);
      if (!behaviour) {
        throw new Error(`Implementation "${implementationName}" not found for strategy "${strategyName}"`);
      }

      const handler = behaviour[actionName];
      if (!handler) {
        throw new Error(`Action "${actionName}" for implementation "${implementationName}" is not found`);
      }

      return handler;
    }
  };

  STRATEGIES.set(strategyName, strategy);

  return strategy;
};

/**
 * Get existing strategy by name
 * @param {string} strategyName - Name of the strategy
 * @returns {Object} Strategy interface
 */
export const getStrategy = (strategyName) => {
  const strategy = STRATEGIES.get(strategyName);
  if (!strategy) {
    throw new Error(`Strategy "${strategyName}" not found`);
  }
  return strategy;
};

/**
 * Get all registered strategies
 * @returns {string[]} Array of strategy names
 */
export const getStrategies = () => {
  return Array.from(STRATEGIES.keys());
};
