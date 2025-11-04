import { createStorage, StorageFactory, StorageMigration } from './storage-factory.js';

class StorageTestSuite {
  constructor(storage, name) {
    this.storage = storage;
    this.name = name;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async run() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${this.name}`);
    console.log('='.repeat(60));

    await this.test('should create a new record', async () => {
      const record = { id: 'test-1', name: 'Test User', email: 'test@example.com' };
      const id = await this.storage.create(record);
      
      if (id !== 'test-1') throw new Error(`Expected id 'test-1', got '${id}'`);
    });

    await this.test('should read an existing record', async () => {
      const record = await this.storage.read('test-1');
      
      if (!record) throw new Error('Record not found');
      if (record.name !== 'Test User') throw new Error('Name mismatch');
      if (record.email !== 'test@example.com') throw new Error('Email mismatch');
    });

    await this.test('should return null for non-existent record', async () => {
      const record = await this.storage.read('non-existent');
      
      if (record !== null) throw new Error(`Expected null, got ${JSON.stringify(record)}`);
    });

    await this.test('should update an existing record', async () => {
      const updated = await this.storage.update('test-1', { name: 'Updated User' });
      
      if (updated.name !== 'Updated User') throw new Error('Update failed');
      if (updated.id !== 'test-1') throw new Error('ID should not change');
    });

    await this.test('should throw error when updating non-existent record', async () => {
      try {
        await this.storage.update('non-existent', { name: 'Test' });
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw new Error(`Wrong error: ${error.message}`);
        }
      }
    });

    await this.test('should check if record exists', async () => {
      const exists = await this.storage.exists('test-1');
      const notExists = await this.storage.exists('non-existent');
      
      if (!exists) throw new Error('test-1 should exist');
      if (notExists) throw new Error('non-existent should not exist');
    });

    await this.test('should count records', async () => {
      await this.storage.create({ id: 'test-2', name: 'User 2' });
      const count = await this.storage.count();
      
      if (count !== 2) throw new Error(`Expected 2 records, got ${count}`);
    });

    await this.test('should read all records', async () => {
      const records = await this.storage.readAll();
      
      if (records.length !== 2) throw new Error(`Expected 2 records, got ${records.length}`);
    });

    await this.test('should delete a record', async () => {
      const deleted = await this.storage.delete('test-2');
      const count = await this.storage.count();
      
      if (!deleted) throw new Error('Delete should return true');
      if (count !== 1) throw new Error(`Expected 1 record after delete, got ${count}`);
    });

    await this.test('should return false when deleting non-existent record', async () => {
      const deleted = await this.storage.delete('non-existent');
      
      if (deleted) throw new Error('Should return false for non-existent record');
    });

    await this.test('should delete all records', async () => {
      await this.storage.create({ id: 'test-3', name: 'User 3' });
      await this.storage.create({ id: 'test-4', name: 'User 4' });
      
      const deletedCount = await this.storage.deleteAll();
      const count = await this.storage.count();
      
      if (deletedCount !== 3) throw new Error(`Expected to delete 3 records, deleted ${deletedCount}`);
      if (count !== 0) throw new Error(`Expected 0 records, got ${count}`);
    });

    await this.test('should throw error when creating duplicate id', async () => {
      await this.storage.create({ id: 'duplicate', name: 'First' });
      
      try {
        await this.storage.create({ id: 'duplicate', name: 'Second' });
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw new Error(`Wrong error: ${error.message}`);
        }
      }
      
      await this.storage.delete('duplicate');
    });

    await this.test('should preserve additional properties', async () => {
      const record = {
        id: 'test-props',
        name: 'Test',
        email: 'test@example.com',
        role: 'admin',
        active: true,
        metadata: { created: Date.now() }
      };
      
      await this.storage.create(record);
      const retrieved = await this.storage.read('test-props');
      
      if (retrieved.role !== 'admin') throw new Error('Role not preserved');
      if (retrieved.active !== true) throw new Error('Active flag not preserved');
      if (!retrieved.metadata) throw new Error('Metadata not preserved');
      
      await this.storage.delete('test-props');
    });

    await this.test('should return correct storage name', () => {
      const name = this.storage.getName();
      if (!name) throw new Error('Storage name should not be empty');
    });

    await this.test('should return correct storage type', () => {
      const type = this.storage.getType();
      if (!['opfs', 'indexeddb'].includes(type)) {
        throw new Error(`Invalid storage type: ${type}`);
      }
    });

    this.printResults();
    return this.results;
  }

  async test(description, fn) {
    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ description, passed: true });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ description, passed: false, error: error.message });
      console.log(`❌ ${description}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n' + '-'.repeat(60));
    console.log(`Results for ${this.name}:`);
    console.log(`  Passed: ${this.results.passed}`);
    console.log(`  Failed: ${this.results.failed}`);
    console.log(`  Total:  ${this.results.passed + this.results.failed}`);
    console.log('-'.repeat(60));
  }
}

async function testMigration() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Storage Migration');
  console.log('='.repeat(60));

  try {
    const availableTypes = StorageFactory.getAvailableTypes();
    
    if (availableTypes.length < 2) {
      console.log('⚠️  Migration test skipped: Need at least 2 storage types available');
      return;
    }

    const storage1 = await createStorage('migration-test-1', availableTypes[0]);
    await storage1.create({ id: '1', name: 'User 1', email: 'user1@example.com' });
    await storage1.create({ id: '2', name: 'User 2', email: 'user2@example.com' });
    await storage1.create({ id: '3', name: 'User 3', email: 'user3@example.com' });

    console.log(`✅ Created 3 records in ${availableTypes[0]}`);

    const storage2 = await createStorage('migration-test-2', availableTypes[1]);
    const result = await StorageMigration.migrate(storage1, storage2, {
      onProgress: (progress) => {
        console.log(`   Migrating: ${progress.current}/${progress.total}`);
      }
    });

    console.log(`✅ Migration completed: ${result.success} success, ${result.failed} failed`);

    const count1 = await storage1.count();
    const count2 = await storage2.count();

    if (count2 !== 3) {
      throw new Error(`Expected 3 records in target storage, got ${count2}`);
    }

    console.log(`✅ Verified: ${count2} records in target storage`);

    const comparison = await StorageMigration.compare(storage1, storage2);
    
    if (!comparison.equal) {
      throw new Error(`Storages are not equal: ${JSON.stringify(comparison.differences)}`);
    }

    console.log('✅ Storages are identical');

    await storage1.deleteAll();
    await storage2.deleteAll();
    await storage1.close();
    await storage2.close();

    console.log('✅ Migration test passed!');
  } catch (error) {
    console.log(`❌ Migration test failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          Week 10: Storage-Agnostic Tests                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const availableTypes = StorageFactory.getAvailableTypes();
  
  console.log(`\nAvailable storage types: ${availableTypes.join(', ')}`);
  console.log(`Recommended: ${StorageFactory.getRecommended()}`);

  const allResults = [];

  
  for (const type of availableTypes) {
    try {
      const storage = await createStorage(`test-${type}`, type);
      const suite = new StorageTestSuite(storage, `${type.toUpperCase()} Storage`);
      const results = await suite.run();
      allResults.push({ type, results });
      
      
      await storage.deleteAll();
      await storage.close();
    } catch (error) {
      console.log(`\n❌ Failed to test ${type}: ${error.message}`);
    }
  }

  await testMigration();
  
  console.log('\n' + '='.repeat(60));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(60));
  
  allResults.forEach(({ type, results }) => {
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  });

  const totalPassed = allResults.reduce((sum, r) => sum + r.results.passed, 0);
  const totalFailed = allResults.reduce((sum, r) => sum + r.results.failed, 0);
  const totalTests = totalPassed + totalFailed;

  console.log('\n' + '='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Total Passed: ${totalPassed}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  if (totalFailed === 0) {
    console.log('🎉 All tests passed! Storage implementations are fully compatible!');
  } else {
    console.log('⚠️  Some tests failed. Review the results above.');
  }
}

runAllTests().catch(error => {
  console.error('Test suite failed:', error);
});
