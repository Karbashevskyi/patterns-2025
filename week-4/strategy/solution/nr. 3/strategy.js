export class Strategy {
  #actions = [];
  #implementations = new Map();

  /**
   * Strategy class for managing multiple implementations and actions
   * @param {string} strategyName - Name of the strategy
   * @param {Object} parameters - Parameters for the strategy
   */
  constructor(strategyName, actions = []) {
    if (typeof strategyName !== "string") {
      throw new Error("Strategy name expected to be string");
    }
    if (!Array.isArray(actions)) {
      throw new Error("Actions expected to be array");
    }
    if (actions.some((action) => typeof action !== "string")) {
      throw new Error("Actions expected to be array of strings");
    }

    this.strategyName = strategyName;
    this.#actions = [...actions];
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
    if (typeof implementationName !== "string") {
      throw new Error("Implementation name expected to be string");
    }
    if (typeof behaviourRecord !== "object" || behaviourRecord === null) {
      throw new Error("behaviourRecord expected to be object");
    }

    const goodBehaviorRecord = {};

    for (const action of this.#actions) {
      if (typeof behaviourRecord[action] !== "function") {
        throw new Error(
          `Action "${action}" expected to be function in behaviourRecord`
        );
      }
      goodBehaviorRecord[action] = behaviourRecord[action];
    }

    this.#implementations.set(implementationName, goodBehaviorRecord);
  }

  /**
   * Get behaviour implementation for specific action
   * @param {string} implementationName - Name of the implementation
   * @param {string} actionName - Name of the action
   * @returns {Function} Action handler function
   */
  getBehaviour(implementationName, actionName) {
    if (!this.#actions.includes(actionName)) {
      throw new Error(
        `Action "${actionName}" is not supported by strategy "${this.strategyName}"`
      );
    }

    const behaviour = this.#implementations.get(implementationName);
    if (!behaviour) {
      throw new Error(
        `Implementation "${implementationName}" not found for strategy "${this.strategyName}"`
      );
    }

    return behaviour[actionName];
  }

  /**
   * Create a new Strategy instance
   * @param {*} strategyName - Name of the strategy
   * @param {*} parameters - Parameters for the strategy
   * @returns {Strategy} New Strategy instance
   */
  static create(strategyName, parameters = {}) {
    const { implementations = {}, actions = [] } = parameters;
    const instance = new Strategy(strategyName, actions);

    if (
      typeof implementations === "object" &&
      implementations !== null &&
      Object.keys(implementations).length &&
      !Array.isArray(implementations)
    ) {
      for (const {0: name, 1: behaviour} of Object.entries(implementations)) {
        instance.registerBehaviour(name, behaviour);
      }
    }

    return instance;
  }
}
