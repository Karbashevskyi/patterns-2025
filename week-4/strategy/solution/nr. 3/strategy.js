export class Strategy {

  #actions = [];
  #implementations = new Map();

  /**
   * Strategy class for managing multiple implementations and actions
   * @param {string} strategyName - Name of the strategy
   * @param {Object} parameters - Parameters for the strategy
   */
  constructor(strategyName, parameters = {actions: [], implementations: {}}) {
    if (typeof strategyName !== 'string') {
      throw new Error('Strategy name expected to be string');
    }
    if (!Array.isArray(parameters.actions)) {
      throw new Error('Actions expected to be array');
    }
    
    this.strategyName = strategyName;
    this.#actions = [...parameters.actions];
    this.#initializeImplementations(parameters.implementations);
  }

  get actions() {
    return [...this.#actions];
  }

  /**
   * Register a behaviour implementation
   * @param {string} implementationName - Name of the implementation
   * @param {Object} behaviourRecord - Object containing action implementations
   */
  registerBehaviour(implementationName, behaviourRecord) {
    if (typeof implementationName !== 'string') {
      throw new Error('Implementation name expected to be string');
    }
    if (typeof behaviourRecord !== 'object' || behaviourRecord === null) {
      throw new Error('behaviourRecord expected to be object');
    }

    for (const action of this.actions) {
      if (typeof behaviourRecord[action] !== 'function') {
        throw new Error(`Action "${action}" expected to be function in behaviourRecord`);
      }
    }

    this.#implementations.set(implementationName, behaviourRecord);
  }

  /**
   * Get behaviour implementation for specific action
   * @param {string} implementationName - Name of the implementation
   * @param {string} actionName - Name of the action
   * @returns {Function} Action handler function
   */
  getBehaviour(implementationName, actionName) {
    if (!this.actions.includes(actionName)) {
      throw new Error(`Action "${actionName}" is not supported by strategy "${this.strategyName}"`);
    }

    const behaviour = this.#implementations.get(implementationName);
    if (!behaviour) {
      throw new Error(`Implementation "${implementationName}" not found for strategy "${this.strategyName}"`);
    }

    const handler = behaviour[actionName];
    if (!handler) {
      throw new Error(`Action "${actionName}" for implementation "${implementationName}" is not found`);
    }

    return handler;
  }

  /**
   * Initialize implementations map
   * @param {*} implementations - Object containing initial implementations
   * @throws {Error} If implementations is not an object or is null
   * @private
   * @returns {void}
   */
  #initializeImplementations(implementations) {
    if (typeof implementations !== 'object' || implementations === null || Array.isArray(implementations)) {
      throw new Error('Implementations expected to be object');
    }

    for (const [name, behaviour] of Object.entries(implementations)) {
      this.registerBehaviour(name, behaviour);
    }
  }

  /**
   * Create a new Strategy instance
   * @param {*} strategyName - Name of the strategy
   * @param {*} parameters - Parameters for the strategy
   * @returns {Strategy} New Strategy instance
   */
  static create(strategyName, parameters = {actions: []}) {
    return new Strategy(strategyName, parameters);
  }
}
