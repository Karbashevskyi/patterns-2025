interface Parameters<ACTIONS extends readonly [string, ...string[]]> {
  actions?: ACTIONS;
  implementations?: {
    [implementationName: string]: {
      [action in ACTIONS[number]]: Function;
    };
  };
}

export declare class Strategy<ACTIONS extends readonly [string, ...string[]]> {
  public constructor(strategyName: string, actions: ACTIONS);

  public readonly strategyName: string;
  public readonly actions: ACTIONS;

  public registerBehaviour(
    implementationName: string,
    behaviourRecord: Record<ACTIONS[number], Function>
  ): void;
  public getBehaviour(implementationName: string, actionName: ACTIONS[number]): Function;

  public static create<ACTIONS extends readonly [string, ...string[]]>(
    strategyName: string,
    parameters: Parameters<ACTIONS>
  ): Strategy<ACTIONS>;
}
