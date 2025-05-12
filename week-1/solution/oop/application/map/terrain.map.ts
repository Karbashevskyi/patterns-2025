import type { ITerrain } from "../../interface/i.terrain.ts";
import { Terrain } from "../../model/terrain.ts";

export class TerrainMap {

    public static fieldValidation: {[key in keyof ITerrain]: (value: unknown) => boolean} = {
        city: (value: unknown) => typeof value === 'string',
        population: (value: unknown) => typeof value === 'number',
        area: (value: unknown) => typeof value === 'number',
        density: (value: unknown) => typeof value === 'number',
        country: (value: unknown) => typeof value === 'string',
    };

    public static fieldConverter: {[key in keyof ITerrain]: (value: unknown) => unknown} = {
        city: (value: unknown) => String(value).trim(),
        population: (value: unknown) => Number(value),
        area: (value: unknown) => Number(value),
        density: (value: unknown) => Number(value),
        country: (value: unknown) => String(value).trim(),
    };

    public static fromObject(object: Record<string, never>): Terrain {

        const initials = {} as ITerrain;

        for (const key in object) {
            if (TerrainMap.fieldValidation[key]) {
                initials[key] = TerrainMap.fieldConverter[key](object[key]);
                const isValid = TerrainMap.fieldValidation[key](initials[key]);
                if (!isValid) {
                    throw new Error(`Invalid value for ${key}: ${initials[key]}`);
                }
            }
        }

        const item = Terrain.create(initials);
        return item;

    }

}