import type { ITerrainWithStatistic } from "../../domain/interface/i.terrain-with-statistic.ts";
import type { ITerrain } from "../../domain/interface/i.terrain.ts";
import { Terrain } from "../../domain/model/terrain.ts";
import { Mapper } from "./mapper.ts";

export class TerrainMapper extends Mapper<ITerrain> {

    public constructor() {
        super({
            fieldConverter: {
                city: (value: unknown) => String(value).trim(),
                population: (value: unknown) => Number(value),
                area: (value: unknown) => Number(value),
                density: (value: unknown) => Number(value),
                country: (value: unknown) => String(value).trim(),
            },
            fieldValidation: {
                city: (value: unknown) => typeof value === 'string',
                population: (value: unknown) => typeof value === 'number',
                area: (value: unknown) => typeof value === 'number',
                density: (value: unknown) => typeof value === 'number',
                country: (value: unknown) => typeof value === 'string',
            },
        });
    }

    public override fromObject(object: Record<string, unknown>): Terrain {

        if (this === undefined) {
            throw new Error("Mapper instance is undefined. Did you use something like this 'factory: mapper.fromObject,'? \n If true use 'factory: (object) => mapper.fromObject(object),' instead.");   
        }

        const initials = super.mapAndValidate(object);

        const item = Terrain.create(initials);
        return item;

    }

    public toTerrainWithStatisticList(terrains: Terrain[]): ITerrainWithStatistic[] {

        const params: {
            maxArea: number;
            totalArea: number;
        } = terrains.reduce((acc, terrain) => {
            acc.maxArea = Math.max(acc.maxArea, terrain.area);
            acc.totalArea += terrain.area;
            return acc;
        }, { maxArea: 0, totalArea: 0 });

        return terrains.map(terrain => {
            const areaPercentage = +((terrain.area / params.totalArea) * 100).toFixed(2);
            const areaPercentageOfMax = +((terrain.area / params.maxArea) * 100).toFixed(2);
            return {
                ...terrain,
                areaPercentage,
                areaPercentageOfMax,
            };
        });
    }

    public static create(): TerrainMapper {
        return new TerrainMapper();
    }

}