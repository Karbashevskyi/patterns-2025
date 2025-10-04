export const selectStrategy = (strategy, name) => {

  if (name in strategy) {
    return strategy[name];
  }
  
  if ('abstract' in strategy) {
    return strategy.abstract;
  }
  
  throw new Error(`Strategy "${name}" not found and no abstract fallback available`);
};
