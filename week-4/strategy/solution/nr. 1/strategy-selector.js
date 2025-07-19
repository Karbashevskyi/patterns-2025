export const selectStrategy = (strategy, name) => {
  const keys = Object.keys(strategy);
  
  if (keys.includes(name)) {
    return strategy[name];
  }
  
  if (keys.includes('abstract')) {
    return strategy.abstract;
  }
  
  throw new Error(`Strategy "${name}" not found and no abstract fallback available`);
};
