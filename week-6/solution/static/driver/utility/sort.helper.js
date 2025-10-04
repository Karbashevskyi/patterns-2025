export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function createSortComparator(sort) {
  if (!sort) return null;
  
  const { field, direction = 'asc' } = typeof sort === 'string' 
    ? { field: sort, direction: 'asc' } 
    : sort;

  return (a, b) => {
    const aVal = getNestedValue(a, field);
    const bVal = getNestedValue(b, field);

    let comparison = 0;
    if (aVal > bVal) comparison = 1;
    if (aVal < bVal) comparison = -1;

    return direction === 'desc' ? -comparison : comparison;
  };
}

export function sortArray(array, sort) {
  const comparator = createSortComparator(sort);
  if (comparator) {
    array.sort(comparator);
  }
  return array;
}
