import type { IPadConfiguration } from "./i.pad.configuration.ts";

export interface IListConsoleConfiguration<I> {
    title: string;
    columns: {
        [key in keyof I]?: {
            title?: string;
            style?: {
                pad?: IPadConfiguration;
            },
            format?: (value: I[key]) => string;
        };
    };
    sortBy: keyof I;
}