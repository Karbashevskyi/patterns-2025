import type { IPadConfiguration } from "./i.pad.configuration.ts";

interface DefaultColumn {
    _index: number;
}

export interface IListConsoleConfiguration<I> {
    title: string;
    columns: {
        [key in keyof (I & DefaultColumn)]?: {
            title?: string;
            style?: {
                pad?: IPadConfiguration;
            },
            format?: (value: (I & DefaultColumn)[key], index: number,) => string;
        };
    };
    sortBy: keyof I;
}