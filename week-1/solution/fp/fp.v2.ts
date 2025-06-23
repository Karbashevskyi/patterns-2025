import { data } from "../fixture";

function toString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
}

interface ITerrain {
    city: string;
    population: number;
    area: number;
    density: number;
    country: string;
    densityPercentageOfMax: number;
}

interface IPadConfiguration {
    align: 'left' | 'right';
    length: number;
}

interface IPresentation {
    style?: {
        cell?: IPadConfiguration;
    };
}

interface IColumn {
    name: string;
    type: string;
}

type ISchema = Array<IPresentation & IColumn>;

const terrainSchema: ISchema = [ // Order of the properties is important
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

interface ICSVToObjectArguments<T> {
    schema: Array<{ type: string; name: string }>;
    fieldConverter: Record<string, (value: unknown) => unknown>;
    ignoreLine?: number; // Default is 1, which means the first line is the header in usual CSV files
    columnDelimiter?: string; // Default is ","
    rowDelimiter?: string; // Default is "\n"
}

const updateDensityPercentageOfMax = (items: ITerrain[]) => {
    const maxDensity = Math.max(...items.map(item => item.density));
    return items.map(item => ({
        ...item,
        densityPercentageOfMax: Math.round((item.density / maxDensity) * 100),
    }));
}

interface ISortArguments<T> {
    by: keyof T;
    direction?: 'asc' | 'desc';
}

function buildSort<T>({ by, direction = 'asc'}: ISortArguments<T>): (items: T[]) => T[] {
    const map = {
        number: (left, right) => (left[by] as number) - (right[by] as number),
        string: (left, right) => String(left[by]).localeCompare(String(right[by])),
    };
    // TODO: Use toSorted instead of sort to avoid mutating the original array.
    return (items: T[]) => ([...items].sort((a, b) => {
        const [left, right] = direction === 'desc' ? [b, a] : [a, b];
        return map[typeof a[by]](left, right);
    }));
}

const styleMap = {
    cell: (value, {align, length}) => ({left: String.prototype.padEnd, right: String.prototype.padStart}[align].call(value, length)),
};

const convertValueByStyle = (value: unknown, styleConfig: Record<string, unknown>): string => Object.keys(styleConfig).map((styleKey) => {
    const styleConfiguration = styleConfig[styleKey];
    return styleMap[styleKey](value, styleConfiguration);
}).join('');

function renderRow<I>(item: I, schema: ISchema): void {
    const row = Object.entries(schema).map(([columnKey, { style }]) => {
        const value = String(item[columnKey] || ''); // Handle missing columns gracefully
        const valueWithStyle = style ? convertValueByStyle(value, style) : value;
        return valueWithStyle;
    }).join(' ');
    console.log(row);
}

const buildRenderInConsole = <I>({ schema }: { schema: ISchema;}) => (list: I[]) => list.map((item) => {
    renderRow<I>(item, schema);
    return item;
});

const fromCSVtoRows = (csv: string, rowDelimiter = '\n', ignoreLine = 1) => {
    if (!csv || typeof csv !== 'string') throw new Error('CSV is required');
    let lines = csv.split(rowDelimiter);
    if (ignoreLine > -1) lines = lines.slice(ignoreLine);
    return lines;
};

const fromLinesToSchema = <T>({ schema, fieldConverter, columnDelimiter = ',' }: ICSVToObjectArguments<T>) => (lines: string[]) => lines.map((line) => {

    const values = line.split(columnDelimiter);
    const defaultFieldConverter = (value: unknown) => value;

    return schema.reduce((item, column, index) => {
        const { type, name } = column;
        const converter = fieldConverter[type] ?? defaultFieldConverter;
        item[name] = converter(values[index]);
        return item;
    }, {} as T);

});

const fromLinesToTerrain = fromLinesToSchema<ITerrain>({
    schema: terrainSchema,
    fieldConverter: { string: toString, number: toNumber, },
})

const sortByDensityPercentageOfMax = buildSort<ITerrain>({ by: 'densityPercentageOfMax', direction: 'desc' });
const pipe = (...fns: Array<(arg: any) => any>) => (arg: any) => fns.reduce((acc, fn) => fn(acc), arg);
const renderInConsole = buildRenderInConsole<ITerrain>({ schema: terrainSchema });

const proccessor = pipe(
    (data: string) => fromCSVtoRows(data),
    (lines: string[]) => fromLinesToTerrain(lines),
    (terrains: ITerrain[]) => updateDensityPercentageOfMax(terrains),
    (terrains: ITerrain[]) => sortByDensityPercentageOfMax(terrains),
    (terrains: ITerrain[]) => renderInConsole(terrains),
);

// With logger
// const logger = (message) => {
//     // console.log(message);
//     return message;
// }

// const proccessor = pipe(
//     logger,
//     (data) => fromCSVtoRows(data),
//     logger,
//     (lines) => fromLinesToTerrain(lines),
//     logger,
//     (terrains) => updateDensityPercentageOfMax(terrains),
//     logger,
//     (terrains) => sortByDensityPercentageOfMax(terrains),
//     logger,
//     (terrains) => renderInConsole(terrains),
//     logger,
// );

// Poor perfomance
// const proccessor = pipe(
//     fromCSVtoRows,
//     fromLinesToTerrain,
//     updateDensityPercentageOfMax,
//     sortByDensityPercentageOfMax,
//     renderInConsole,
// );
    
proccessor(data); // Returns the list of terrains