const data = `city,population,area,density,country
  Shanghai,24256800,6340,3826,China
  Delhi,16787941,1484,11313,India
  Lagos,16060303,1171,13712,Nigeria
  Istanbul,14160467,5461,2593,Turkey
  Tokyo,13513734,2191,6168,Japan
  Sao Paulo,12038175,1521,7914,Brazil
  Mexico City,8874724,1486,5974,Mexico
  London,8673713,1572,5431,United Kingdom
  New York City,8537673,784,10892,United States
  Bangkok,8280925,1569,5279,Thailand`;

const terrainSchema = [ // Order of the properties is important
    { 
        name: 'city', type: 'string', 
        style: { 
            cell: { align: 'left', length: 18, }, 
        }, 
    },
    { 
        name: 'population', type: 'number', 
        style: { 
            cell: { align: 'right', length: 10, }, 
        }, 
    },
    { 
        name: 'area', type: 'number', 
        style: { 
            cell: { align: 'right', length: 8, }, 
        }, 
    },
    { 
        name: 'density', type: 'number', 
        style: { 
            cell: { align: 'right', length: 8, }, 
        }, 
    },
    { 
        name: 'country', type: 'string', 
        style: { 
            cell: { align: 'right', length: 18, }, 
        }, 
    },
    { 
        name: 'densityPercentageOfMax', type: 'number', 
        style: { 
            cell: { align: 'right', length: 8, }, 
        }, 
    },
];

const updateDensityPercentageOfMax = (items) => {
    const maxDensity = Math.max(...items.map(({density}) => density));
    return items.map(item => ({
        ...item,
        densityPercentageOfMax: Math.round((item.density / maxDensity) * 100),
    }));
};

const buildSort = ({ by, direction = 'asc' }) => {
    const map = {
        number: (left, right) => (left[by] - right[by]),
        string: (left, right) => String(left[by]).localeCompare(String(right[by])),
    };
    // TODO: Use toSorted instead of sort to avoid mutating the original array.
    return (items) => ([...items].sort((a, b) => {
        const [left, right] = direction === 'desc' ? [b, a] : [a, b];
        return map[typeof a[by]](left, right);
    }));
}

const buildRenderInConsole = ({ schema }) => (list) => list.map((item) => {
    
    const styleMap = {
        cell: (value, {align, length}) => ({left: String.prototype.padEnd, right: String.prototype.padStart}[align].call(value, length)),
    };

    const convertValueByStyle = (value, styleConfig) => 
        Object.entries(styleConfig).map(([styleKey, styleConfiguration]) => 
            styleMap[styleKey](value, styleConfiguration)).join('')

    const row = Object.entries(schema).map(([_, { style, name }]) => {
        const value = String(item[name] || ''); // Handle missing columns gracefully
        const valueWithStyle = style ? convertValueByStyle(value, style) : value;

        return valueWithStyle;
    }).join(' ');

    console.log(row);

    return item;
});

const fromCSVtoRows = (csv, rowDelimiter = '\n', ignoreLine = 1) => {
    if (!csv || typeof csv !== 'string') throw new Error('CSV is required');
    let lines = csv.split(rowDelimiter);
    if (ignoreLine > -1) lines = lines.slice(ignoreLine);
    return lines;
};

const fromLinesToSchema = ({ schema, fieldConverter, columnDelimiter = ',' }) => (lines) => lines.map((line) => {
    
    const values = line.split(columnDelimiter);

    return schema.reduce((item, column, index) => {
        const { type, name } = column;
        const converter = fieldConverter[type] ?? ((x) => x);
        item[name] = converter(values[index]);
        return item;
    }, {});

});

const sortByDensityPercentageOfMax = buildSort({ by: 'densityPercentageOfMax', direction: 'desc' });
const pipe = (...fns) => (arg) => fns.reduce((acc, fn) => fn(acc), arg);
const toString = (value) => value ? String(value) : '';
const toNumber = (value) => value ? Number(value) : 0;

const proccessor = pipe(
    fromCSVtoRows,
    fromLinesToSchema({
        schema: terrainSchema,
        fieldConverter: { string: toString, number: toNumber, },
    }),
    updateDensityPercentageOfMax,
    sortByDensityPercentageOfMax,
    buildRenderInConsole({ schema: terrainSchema }),
);
    
proccessor(data); // Returns the list of terrains