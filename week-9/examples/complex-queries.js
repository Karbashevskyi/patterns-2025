
import { query } from '../balanced.js';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║            Complex Query Examples (Balanced)              ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('1. INNER JOIN');
console.log('─'.repeat(60));

const joinQuery = query()
  .select('users.name', 'posts.title', 'posts.created_at')
  .from('users')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .where('posts.published', '=', true)
  .orderBy('posts.created_at', 'DESC')
  .toSQL();

console.log(joinQuery);
console.log('');

console.log('2. LEFT JOIN (include users without posts)');
console.log('─'.repeat(60));

const leftJoinQuery = query()
  .select('users.name', 'COUNT(posts.id) as post_count')
  .from('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .groupBy('users.id', 'users.name')
  .toSQL();

console.log(leftJoinQuery);
console.log('');

console.log('3. Multiple JOINs');
console.log('─'.repeat(60));

const multiJoinQuery = query()
  .select('users.name', 'posts.title', 'comments.content', 'comments.created_at')
  .from('posts')
  .join('users', 'posts.user_id', '=', 'users.id')
  .leftJoin('comments', 'posts.id', '=', 'comments.post_id')
  .where('posts.published', '=', true)
  .orderBy('comments.created_at', 'DESC')
  .toSQL();

console.log(multiJoinQuery);
console.log('');

console.log('4. GROUP BY with HAVING clause');
console.log('─'.repeat(60));

const groupQuery = query()
  .select('users.id', 'users.name', 'COUNT(posts.id) as post_count')
  .from('users')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .groupBy('users.id', 'users.name')
  .having('COUNT(posts.id)', '>', 5)
  .orderBy('post_count', 'DESC')
  .toSQL();

console.log(groupQuery);
console.log('Explanation: Find users who have more than 5 posts');
console.log('');

console.log('5. Complex WHERE conditions');
console.log('─'.repeat(60));

const complexWhereQuery = query()
  .select('*')
  .from('products')
  .where('category', '=', 'electronics')
  .where('price', '>', 100)
  .where('price', '<', 1000)
  .where('in_stock', '=', true)
  .orWhere('on_order', '=', true)
  .toSQL();

console.log(complexWhereQuery);
console.log('');

console.log('6. Advanced aggregation query');
console.log('─'.repeat(60));

const aggregationQuery = query()
  .select(
    'categories.name as category',
    'COUNT(products.id) as product_count',
    'AVG(products.price) as avg_price',
    'MIN(products.price) as min_price',
    'MAX(products.price) as max_price'
  )
  .from('products')
  .join('categories', 'products.category_id', '=', 'categories.id')
  .groupBy('categories.id', 'categories.name')
  .having('COUNT(products.id)', '>', 10)
  .orderBy('product_count', 'DESC')
  .toSQL();

console.log(aggregationQuery);
console.log('Explanation: Product statistics by category (only categories with 10+ products)');
console.log('');

console.log('7. Recent activity report');
console.log('─'.repeat(60));

const activityQuery = query()
  .select(
    'users.id',
    'users.name',
    'users.email',
    'COUNT(DISTINCT posts.id) as posts',
    'COUNT(DISTINCT comments.id) as comments',
    'MAX(posts.created_at) as last_post',
    'MAX(comments.created_at) as last_comment'
  )
  .from('users')
  .leftJoin('posts', 'users.id', '=', 'posts.user_id')
  .leftJoin('comments', 'users.id', '=', 'comments.user_id')
  .where('users.active', '=', true)
  .groupBy('users.id', 'users.name', 'users.email')
  .orderBy('last_post', 'DESC')
  .limit(20)
  .toSQL();

console.log(activityQuery);
console.log('Explanation: User activity report with post and comment counts');
console.log('');

console.log('8. E-commerce: Find top customers');
console.log('─'.repeat(60));

const ecommerceQuery = query()
  .select(
    'customers.id',
    'customers.name',
    'customers.email',
    'COUNT(DISTINCT orders.id) as order_count',
    'SUM(orders.total) as total_spent',
    'AVG(orders.total) as avg_order_value',
    'MAX(orders.created_at) as last_order_date'
  )
  .from('customers')
  .join('orders', 'customers.id', '=', 'orders.customer_id')
  .where('orders.status', '=', 'completed')
  .where('orders.created_at', '>', '2024-01-01')
  .groupBy('customers.id', 'customers.name', 'customers.email')
  .having('SUM(orders.total)', '>', 1000)
  .orderBy('total_spent', 'DESC')
  .limit(10)
  .toSQL();

console.log(ecommerceQuery);
console.log('Explanation: Top 10 customers by spend in 2024 (minimum $1000)');
console.log('');

console.log('9. Using raw SQL for special cases');
console.log('─'.repeat(60));

const rawSqlQuery = query()
  .select('users.*', 'TIMESTAMPDIFF(YEAR, users.birthdate, CURDATE()) as age')
  .from('users')
  .whereRaw('TIMESTAMPDIFF(YEAR, users.birthdate, CURDATE()) >= 18')
  .whereRaw('TIMESTAMPDIFF(YEAR, users.birthdate, CURDATE()) <= 65')
  .orderBy('age', 'ASC')
  .toSQL();

console.log(rawSqlQuery);
console.log('Explanation: Users between 18-65 years old (calculated from birthdate)');
console.log('');

console.log('10. Execute complex query');
console.log('─'.repeat(60));

async function complexExecution() {
  const activeAuthors = await query()
    .select(
      'users.id',
      'users.name',
      'users.email'
    )
    .from('users')
    .join('posts', 'users.id', '=', 'posts.user_id')
    .where('users.active', '=', true)
    .where('posts.created_at', '>', new Date('2024-01-01'))
    .groupBy('users.id', 'users.name', 'users.email')
    .having('COUNT(posts.id)', '>', 3)
    .orderBy('users.name', 'ASC')
    .get();

  console.log('Found', activeAuthors.length, 'active authors with 3+ posts in 2024');
  
  if (activeAuthors.length > 0) {
    console.log('Sample author:', activeAuthors[0]);
  }
}

complexExecution().then(() => {
  console.log('\n✅ All complex examples completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - JOINs are expressed clearly');
  console.log('   - GROUP BY and HAVING work together');
  console.log('   - Aggregation functions are easy to use');
  console.log('   - Raw SQL can be mixed in when needed');
  console.log('   - Fluent API remains readable even for complex queries');
});
