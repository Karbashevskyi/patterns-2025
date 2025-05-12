import type { ITerrain } from "./i.terrain.ts";

export interface ITerrainWithStatistic extends ITerrain {

    areaPercentage: number;
    areaPercentageOfMax: number;

}