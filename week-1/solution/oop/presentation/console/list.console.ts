import type { IListConsoleConfiguration } from "../interface/i.list.console.configuration.ts";
import { styleMap } from "../util/style-map.ts";

export class ListConsole<I> {

    #configuration: IListConsoleConfiguration<I>;

    public getConfiguration(): IListConsoleConfiguration<I> {
        return this.#configuration;
    }

    /**
     * Sets the configuration for the console.
     * @param value - The new configuration to set.
     */
    public setConfiguration(value: IListConsoleConfiguration<I>): void {
        this.#configuration = value;
    }

    #list: I[] = [];

    public getList(): I[] {
        return this.#list;
    }

    /**
     * Use this method to set the list of terrains. Before use the method, check if the list is list of terrains.
     * @param value - The list of terrains to set.
     * @throws {Error} - If the list is not a list of terrains.
     * @example
     * const terrainList = new TerrainListConsole();
     * terrainList.setList([
     *     new Terrain({ city: 'City1', population: 1000, area: 100, density: 10, country: 'Country1' }),
     * ]);
     */
    public setList(value: I[]) {
        const { sortBy, sortOrder } = this.#configuration;
        // TODO: Use toSorted instead of sort to avoid mutating the original array.
        const sortedList = [...value].sort((a, b) => {
                const [left, right] = sortOrder === 'desc' ? [b, a] : [a, b];
            switch (typeof a[sortBy]) {
                case 'number':
                    return (left[sortBy] as number) - (right[sortBy] as number);
                case 'string':
                    return String(left[sortBy]).localeCompare(String(right[sortBy]));
                case 'boolean':
                    return Number(left[sortBy]) - Number(right[sortBy]);
                default:
                    throw new Error(`Unsupported type for sorting: ${typeof a[sortBy]}`);
            }
        });
        this.#list = sortedList;
    }

    /**
     * Adds a new column to the configuration.
     * @param columnName - The name of the new column.
     * @param style - The style configuration for the new column.
     */
    public addColumn(columnName: string, columnConfiguration: {
        style?: Record<string, unknown>;
        format?: (value: I[keyof I]) => string;
    }): void {
        const { columns } = this.#configuration;
        this.#configuration.columns[columnName] = {
            ...columns[columnName],
            ...columnConfiguration,
        };
    }

    public render(): void {
        const { columns, title } = this.getConfiguration();

        console.log();
        console.log(title);
        console.log();

        // [HEADER] Render the header
        const header = Object.keys(columns).map((columnKey) => {
            const column = columns[columnKey];
            const text = column?.title || columnKey;
            const styleConfig = column?.style;
            const value = styleConfig ? this.convertValueByStyle(text, styleConfig) : text;
            return value;
        }).join(' | ');
        console.log(header);
        console.log('-'.repeat(header.length));

        // [BODY] Render the list of terrains
        this.#list.forEach((item, index) => {
            const row = Object.keys(columns).map((columnKey) => {
                const value = item[columnKey] || ''; // Handle missing columns gracefully
                const column = columns[columnKey];
                const styleConfig = column?.style;

                const formattedValue = column.format ? column.format(value, index) :  String(value);
                const valueWithStyle = styleConfig ? this.convertValueByStyle(formattedValue, styleConfig) : formattedValue;
                return valueWithStyle;
            }).join(' | ');
            console.log(row);
        });
        console.log();
    }

    private convertValueByStyle(value: unknown, styleConfig: Record<string, unknown>): string {
        return Object.keys(styleConfig).map((styleKey) => this.styleValue(value, styleKey, styleConfig)).join('');
    }

    private styleValue(value: unknown, styleKey: string, styleConfig: Record<string, unknown>): string {
        const styleConfiguration = styleConfig[styleKey];
        return styleMap[styleKey](value, styleConfiguration);
    }

    public static create<I>(initials: IListConsoleConfiguration<I>): ListConsole<I> {
        const instance = new ListConsole<I>();
        instance.setConfiguration(initials);
        return instance;
    }

}