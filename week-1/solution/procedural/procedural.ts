import { data } from "../fixture.ts";

/**
 * ///////////////////////////////////////////////////////////////////////////
 * START SECTION: Field Conversion
 * /////////////////////////////////////////////////////////////////////////
 */

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

const fieldConverter = {
    string: toString,
    number: toNumber,
};

/**
 * ////////////////////////////////////////////////////////////////////////////
 * END SECTION: Field Conversion
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * ////////////////////////////////////////////////////////////////////////////
 * START SECTION: Presentation
 * ////////////////////////////////////////////////////////////////////////////
 */

interface IPadConfiguration {
    side: 'left' | 'right';
    length: number;
}

interface IPresentation {
    title: string;
    style?: {
        pad?: IPadConfiguration;
    };
    format?: (value: unknown, index?: number) => string;
}

type IPresentationSchema<T> = { 
    [key in keyof T]: IPresentation;
}

const styleMap = {
    pad: (value: string, {side, length}: IPadConfiguration) => {
        switch (side) {
            case 'left':
                return value.padEnd(length);
            case 'right':
                return value.padStart(length);
        }
    },
};

function convertValueByStyle(value: unknown, styleConfig: Record<string, unknown>): string {

    return Object.keys(styleConfig).map((styleKey) => {
        const styleConfiguration = styleConfig[styleKey];
        return styleMap[styleKey](value, styleConfiguration);
    }).join('');
}

function renderRow<I>(item: I, index: number, presentationSchema: IPresentationSchema<I>): void {
    const row = Object.keys(presentationSchema).map((columnKey) => {
        const value = item[columnKey] || ''; // Handle missing columns gracefully
        const {style, format} = presentationSchema[columnKey];

        const formattedValue = format ? format(value, index) : String(value);
        const valueWithStyle = style ? convertValueByStyle(formattedValue, style) : formattedValue;
        return valueWithStyle;
    }).join(' ');
    console.log(row);
}

function renderList<I>({ list, presentationSchema }: { list: I[]; presentationSchema: IPresentationSchema<I>;}): void {

    list.forEach((item, index) => {
        renderRow<I>(item, index, presentationSchema);
    });

    console.log();
}

/**
 * ////////////////////////////////////////////////////////////////////////////
 * END SECTION: Presentation
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * ////////////////////////////////////////////////////////////////////////////
 * START SECTION: Schema Definition
 * ////////////////////////////////////////////////////////////////////////////
 */

interface ITerrain {
    city: string;
    population: number;
    area: number;
    density: number;
    country: string;
    densityPercentageOfMax: number;
}

const terrainSchema = [ // Order of the properties is important
    { name: 'city', type: 'string', },
    { name: 'population', type: 'number', },
    { name: 'area', type: 'number', },
    { name: 'density', type: 'number', },
    { name: 'country', type: 'string', },
    { name: 'densityPercentageOfMax', type: 'number', },
];

const terrainPresentationSchema: IPresentationSchema<ITerrain> = {
    city: {
        title: 'City',
        style: {
            pad: { side: 'left', length: 18, },
        },
    },
    population: {
        title: 'Population',
        style: {
            pad: { side: 'right', length: 10, },
        },
    },
    area: {
        title: 'Area',
        style: {
            pad: { side: 'right', length: 8, },
        },
    },
    density: {
        title: 'Density',
        style: {
            pad: { side: 'right', length: 8, },
        },
    },
    country: {
        title: 'Country',
        style: {
            pad: { side: 'right', length: 18, },
        },
    },
    densityPercentageOfMax: {
        title: 'Density Percentage of Max',
        style: { 
            pad: {
                side: 'right',
                length: 8,
            },
        },
        format: (value) => `${value}%`,
    }
};

/**
 * ////////////////////////////////////////////////////////////////////////////
 * END SECTION: Schema Definition
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * ////////////////////////////////////////////////////////////////////////////
 * START SECTION: Helpers
 * ////////////////////////////////////////////////////////////////////////////
 */

function updateDensityPercentageOfMax(terrains: ITerrain[], maxDensity: number): ITerrain[] {
    return terrains.map((item) => {
        const densityPercentageOfMax = Math.round((item.density / maxDensity) * 100);
        return { ...item, densityPercentageOfMax };
    });
}

interface ISortArguments<T> {
    items: T[];
    by: keyof T;
    direction?: 'asc' | 'desc';
}

function toSorted<T>({ items, by, direction = 'asc',}: ISortArguments<T>): T[] {
    // TODO: Use toSorted instead of sort to avoid mutating the original array.
    return [...items].sort((a, b) => {
        const [left, right] = direction === 'desc' ? [b, a] : [a, b];
        switch (typeof a[by]) {
            case 'number':
                return (left[by] as number) - (right[by] as number);
            case 'string':
                return String(left[by]).localeCompare(String(right[by]));
            default:
                throw new Error(`Unsupported type for sorting: ${typeof a[by]}`);
        }
    });
}

/**
 * ////////////////////////////////////////////////////////////////////////////
 * END SECTION: Helpers
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * ////////////////////////////////////////////////////////////////////////////
 * START SECTION: CSV to Object Conversion
 * ////////////////////////////////////////////////////////////////////////////
 */

interface ICSVToObjectArguments<T> {
    csv: string;
    schema: Array<{ type: string; name: string }>;
    fieldConverter: Record<string, (value: unknown) => unknown>;
    ignoreLine?: number; // Default is 1, which means the first line is the header in usual CSV files
    columnDelimiter?: string; // Default is ","
    rowDelimiter?: string; // Default is "\n"
    handlers?: {
        eachItem?: (item: T) => void;
    }
}

function CSVToObject<T>({ csv, schema, fieldConverter, ignoreLine = 1, columnDelimiter = ',', rowDelimiter = '\n', handlers = {} }: ICSVToObjectArguments<T>): T[] {

    if (!csv) throw new Error('CSV is required');
    if (!schema) throw new Error('Schema is required');
    if (!fieldConverter) throw new Error('Field converter is required');

    let lines = csv.split(rowDelimiter);

    if (ignoreLine > -1) lines = lines.slice(ignoreLine);

    const defaultFieldConverter = ((value: unknown) => value);

    const { eachItem } = handlers;

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

        eachItem?.(item);

        return item;

    });

}

/**
 * ////////////////////////////////////////////////////////////////////////////
 * END SECTION: CSV to Object Conversion
 * ////////////////////////////////////////////////////////////////////////////
 */

/**
 * ////////////////////////////////////////////////////////////////////////////
 * START SECTION: User Code
 * ////////////////////////////////////////////////////////////////////////////
 */

let maxDensity = 0;

let terrains = CSVToObject<ITerrain>({
    csv: data,
    schema: terrainSchema,
    fieldConverter,
    handlers: {
        eachItem: ({ density }) => {
            maxDensity = Math.max(maxDensity, density);
        },
    }
});

terrains = updateDensityPercentageOfMax(terrains, maxDensity);

terrains = toSorted({
    items: terrains,
    by: 'densityPercentageOfMax',
    direction: 'desc'
});

renderList<ITerrain>({
    list: terrains,
    presentationSchema: terrainPresentationSchema,
});

/**
 * //////////////////////////////////////////////////////////////////////////
 * END SECTION: User Code
 * //////////////////////////////////////////////////////////////////////////
 */