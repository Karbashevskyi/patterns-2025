import { data } from "../fixture.ts";
import { FromCSV } from "./unitl/from-csv.ts";
import { Terrain } from "./domain/model/terrain.ts";
import { TerrainMapper } from "./application/mapper/terrain.mapper.ts";

function measurePerformance(label: string, fn: () => void): void {
    console.log();
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    console.log();
}

function runPerformanceTests() {
    console.log("Running performance tests...");

    const mapper = TerrainMapper.create();

    measurePerformance("Test 1: Parsing large CSV", () => {
        const largeCSV = Array(10000).fill(data).join("\n");
        const fromCSV = FromCSV.create<Terrain>({
            source: largeCSV,
            factory: (object) => mapper.fromObject(object),
        });
        const items = fromCSV.parse();
        console.log(`Parsed ${items.length} items.`);
    });

    measurePerformance("Test 2: Parsing small CSV", () => {
        const smallCSV = data;
        const fromCSV = FromCSV.create<Terrain>({
            source: smallCSV,
            factory: (object) => mapper.fromObject(object),
        });
        const items = fromCSV.parse();
        console.log(`Parsed ${items.length} items.`);
    });

    measurePerformance("Test 3: Invalid CSV", () => {
        const invalidCSV = "invalid,data,without,proper,format";
        const fromCSV = FromCSV.create<Terrain>({
            source: invalidCSV,
            factory: (object) => mapper.fromObject(object),
        });
        const errors = fromCSV.getErrors();
        console.log(`Found ${errors.length} errors.`);
    });

    console.log("Performance tests completed.");
}

runPerformanceTests();