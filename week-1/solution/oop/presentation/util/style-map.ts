import type { IPadConfiguration } from "../interface/i.pad.configuration.ts";


export const styleMap = {
    pad: (value: string, {side, length}: IPadConfiguration) => {
        switch (side) {
            case 'left':
                return value.padEnd(length);
            case 'right':
                return value.padStart(length);
        }
    },
};