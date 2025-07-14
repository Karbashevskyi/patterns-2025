export declare interface StrategyInterface {
  registerBehaviour(implementationName: string, behaviour: Record<string, Function>): void;
  getBehaviour(implementationName: string, actionName: string): Function;
}

export declare function createStrategy(strategyName: string, actions: string[]): StrategyInterface;
export declare function getStrategy(strategyName: string): StrategyInterface;
export declare function getStrategies(): string[];
