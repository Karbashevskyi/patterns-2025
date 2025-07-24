import { selectStrategy } from '../nr. 1/strategy-selector.js';

export const RENDERERS = {
  abstract: () => {
    return 'Not implemented';
  },

  console: (data) => {
    const keys = Object.keys(data[0]);
    const header = keys.join('\t');
    const rows = data.map(row => keys.map(key => row[key]).join('\t'));
    return [header, ...rows].join('\n');
  },

  web: (data) => {
    const keys = Object.keys(data[0]);
    const line = (row) =>
      '<tr>' + keys.map((key) => `<td>${row[key]}</td>`).join('') + '</tr>';
    const output = [
      '<table><tr>',
      keys.map((key) => `<th>${key}</th>`).join(''),
      '</tr>',
      data.map(line).join(''),
      '</table>',
    ];
    return output.join('');
  },

  markdown: (data) => {
    const keys = Object.keys(data[0]);
    const line = (row) =>
      '|' + keys.map((key) => `${row[key]}`).join('|') + '|';
    const output = [
      '|' + keys.map((key) => `${key}`).join('|') + '|',
      '|' + keys.map(() => '---').join('|') + '|',
      ...data.map(line)
    ];
    return output.join('\n');
  },
};

export const context = (rendererName) => {
  const renderer = selectStrategy(RENDERERS, rendererName);
  return (data) => renderer(data);
};
