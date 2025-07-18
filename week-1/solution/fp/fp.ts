import { data } from "../fixture";

function toString(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).trim();
}

function toNumber(value: unknown): number {
    if (value === null || value === undefined) {
        return 0;
    }
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
    side: 'left' | 'right';
    length: number;
}

interface IPresentation {
    style?: {
        pad?: IPadConfiguration;
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
            pad: { side: 'left', length: 18, }, 
        }, 
    },
    { 
        name: 'population', type: 'number', 
        style: { 
            pad: { side: 'right', length: 10, }, 
        }, 
    },
    { 
        name: 'area', type: 'number', 
        style: { 
            pad: { side: 'right', length: 8, }, 
        }, 
    },
    { 
        name: 'density', type: 'number', 
        style: { 
            pad: { side: 'right', length: 8, }, 
        }, 
    },
    { 
        name: 'country', type: 'string', 
        style: { 
            pad: { side: 'right', length: 18, }, 
        }, 
    },
    { 
        name: 'densityPercentageOfMax', type: 'number', 
        style: { 
            pad: { side: 'right', length: 8, }, 
        }, 
    },
];

const pipe = (...fns: Array<(arg: any) => any>) => (arg: any) => fns.reduce((acc, fn) => fn(acc), arg)

interface ICSVToObjectArguments<T> {
    schema: Array<{ type: string; name: string }>;
    fieldConverter: Record<string, (value: unknown) => unknown>;
    ignoreLine?: number; // Default is 1, which means the first line is the header in usual CSV files
    columnDelimiter?: string; // Default is ","
    rowDelimiter?: string; // Default is "\n"
}

function buildConverterCSV<T>({ schema, fieldConverter, ignoreLine = 1, columnDelimiter = ',', rowDelimiter = '\n', }: ICSVToObjectArguments<T>): ((csv: string) => T[]) {

    return (csv: string): T[] => {

        if (!csv || typeof csv !== 'string') throw new Error('CSV is required');

        let lines = csv.split(rowDelimiter);

        if (ignoreLine > -1) lines = lines.slice(ignoreLine);

        const defaultFieldConverter = ((value: unknown) => value);

        return lines.map((line) => {

            const values = line.split(columnDelimiter);

            const item = {} as T;

            for (const column in schema) {
                const rawValue = values[column];
                const { type, name } = schema[column];
                const converter = fieldConverter[type] ?? defaultFieldConverter;
                const fieldValue = converter(rawValue);
                item[name] = fieldValue;
            }

            return item;

        });
        
    }

}

const updateDensityPercentageOfMax = (items: ITerrain[]) => {
    const maxDensity = Math.max(...items.map(item => item.density));
    return items.map(item => ({
        ...item,
        densityPercentageOfMax: (item.density / maxDensity) * 100,
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
    pad: (value: string, {side, length}: IPadConfiguration) => ({left: value.padEnd, right: value.padStart}[side](length)),
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

const fromCSVtoTerrain = buildConverterCSV<ITerrain>({
    schema: terrainSchema,
    fieldConverter: { string: toString, number: toNumber, },
});

const sortByDensityPercentageOfMax = buildSort<ITerrain>({ by: 'densityPercentageOfMax', direction: 'desc' });

const renderInConsole = buildRenderInConsole<ITerrain>({ schema: terrainSchema });

const proccessor = pipe(
    fromCSVtoTerrain,
    updateDensityPercentageOfMax,
    sortByDensityPercentageOfMax,
    renderInConsole,
);
    
proccessor(data);