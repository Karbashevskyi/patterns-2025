import { data } from "../fixture.ts";
import { FromCSV } from "./unitl/from-csv.ts";
import { Terrain } from "./model/terrain.ts";
import { TerrainMap } from "./application/map/terrain.map.ts";

function assertEqual(actual: any, expected: any, message: string): void {
    if (actual !== expected) {
        console.error(`Test failed: ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual: ${actual}`);
    } else {
        console.log(`Test passed: ${message}`);
    }
}

function describe(message: string, fn: () => void): void {
    console.log('');
    console.log(message);
    fn();
    console.log('');
}

// Unit tests for fromCSV
function runTests() {
    console.log("Running tests for fromCSV...");

    describe("Test 1: Single element CSV", () => {
        // Test 1: Single element CSV
        const csv = "grass";
        const fromCSV = FromCSV.create({
            source: csv,
        });

        assertEqual(fromCSV.valid(), false, "Single element CSV should be invalid");
        assertEqual(fromCSV.invalid(), true, "Single element CSV should be invalid");

        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 2, "Single element CSV should have 2 errors");
    });

    describe("Test 2: Multiple elements CSV", () => {
        const csv = "grass,water,rock";
        const fromCSV = FromCSV.create({
            source: csv,
        });
        assertEqual(fromCSV.valid(), false, "Multiple elements CSV should be invalid");
        assertEqual(fromCSV.invalid(), true, "Multiple elements CSV should be invalid");
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 2, "Multiple elements CSV should have 2 errors");
    });

    describe("Test 3: Empty CSV", () => {
        const csv = "";
        const fromCSV = FromCSV.create({
            source: csv,
        });
        assertEqual(fromCSV.valid(), false, "Empty CSV should be invalid");
        assertEqual(fromCSV.invalid(), true, "Empty CSV should be invalid");
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 2, "Empty CSV should have 2 errors");

    });

    describe("Test 4: Data from fixtures", () => {

        const fromCSV = FromCSV.create<Terrain>({
            source: data,
            factory: TerrainMap.fromObject,
        });
        const items = fromCSV.parse();
        assertEqual(items.length, 10, "Fixture data should return an array of length 10");

        const [firstTerrain] = items;

        // First item is Terrain
        assertEqual(firstTerrain instanceof Terrain, true, "First item should be Terrain");

        assertEqual(firstTerrain.city, "Shanghai", "First city should be Shanghai");
        assertEqual(firstTerrain.population, 24256800, "First city population should be 24256800");
        assertEqual(firstTerrain.area, 6340, "First city area should be 6340");
        assertEqual(firstTerrain.density, 3826, "First city density should be 3826");
        assertEqual(firstTerrain.country, "China", "First city country should be China");
        
        const errors = fromCSV.getErrors();
        assertEqual(errors.length, 0, "Fixture data should not have errors");

    });

    console.log("All tests completed.");
}

// Run the tests
runTests();