/**
 * Week 9: Basic Query Examples
 * Using the Balanced Approach
 */

import { query } from '../balanced.js';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║              Basic Query Examples (Balanced)              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Example 1: Simple SELECT
console.log('1. Simple SELECT query');
console.log('─'.repeat(60));

const simpleQuery = query()
  .select('id', 'name', 'email')
  .from('users')
  .toSQL();

console.log(simpleQuery);
console.log('');

// Example 2: SELECT with WHERE
console.log('2. SELECT with WHERE clause');
console.log('─'.repeat(60));

const whereQuery = query()
  .select('*')
  .from('users')
  .where('age', '>', 18)
  .where('active', '=', true)
  .toSQL();

console.log(whereQuery);
console.log('');

// Example 3: SELECT with OR
console.log('3. SELECT with OR conditions');
console.log('─'.repeat(60));

const orQuery = query()
  .select('name', 'email')
  .from('users')
  .where('role', '=', 'admin')
  .orWhere('role', '=', 'moderator')
  .toSQL();

console.log(orQuery);
console.log('');

// Example 4: Convenience methods
console.log('4. Using convenience methods');
console.log('─'.repeat(60));

const convenienceQuery = query()
  .from('users')
  .whereId(42)
  .toSQL();

console.log('whereId(42):', convenienceQuery);

const inQuery = query()
  .from('users')
  .whereIn('id', [1, 2, 3, 4, 5])
  .toSQL();

console.log('whereIn([1,2,3,4,5]):', inQuery);

const likeQuery = query()
  .from('users')
  .whereLike('email', '%@gmail.com')
  .toSQL();

console.log('whereLike(email):', likeQuery);

const nullQuery = query()
  .from('users')
  .whereNotNull('deleted_at')
  .toSQL();

console.log('whereNotNull(deleted_at):', nullQuery);
console.log('');

// Example 5: ORDER BY
console.log('5. ORDER BY clause');
console.log('─'.repeat(60));

const orderQuery = query()
  .select('name', 'created_at')
  .from('users')
  .orderBy('created_at', 'DESC')
  .orderBy('name', 'ASC')
  .toSQL();

console.log(orderQuery);
console.log('');

// Example 6: LIMIT and OFFSET
console.log('6. LIMIT and OFFSET (pagination)');
console.log('─'.repeat(60));

const paginationQuery = query()
  .select('*')
  .from('users')
  .orderBy('id', 'ASC')
  .limit(10)
  .offset(20)
  .toSQL();

console.log(paginationQuery);
console.log('Explanation: Get 10 users starting from the 21st (page 3 with 10 per page)');
console.log('');

// Example 7: Execution methods
console.log('7. Different execution methods');
console.log('─'.repeat(60));

async function executionExamples() {
  // get() - returns all results
  const allUsers = await query()
    .from('users')
    .where('active', '=', true)
    .get();
  console.log('get() returned:', allUsers.length, 'users');

  // first() - returns first result only
  const firstUser = await query()
    .from('users')
    .whereId(1)
    .first();
  console.log('first() returned:', firstUser);

  // pluck() - returns array of specific field
  const emails = await query()
    .from('users')
    .where('active', '=', true)
    .pluck('email');
  console.log('pluck(email) returned:', emails);

  // count() - returns count
  const userCount = await query()
    .from('users')
    .where('active', '=', true)
    .count();
  console.log('count() returned:', userCount);
}

executionExamples().then(() => {
  console.log('\n✅ All basic examples completed!');
});
