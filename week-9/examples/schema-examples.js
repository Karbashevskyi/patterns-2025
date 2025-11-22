
import { schema } from '../balanced.js';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║          Schema Definition Examples (Balanced)            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('1. Simple users table');
console.log('─'.repeat(60));

const simpleSchema = schema()
  .table('users', t => {
    t.id();
    t.string('name');
    t.string('email').unique();
    t.timestamp('created_at');
  });

console.log(simpleSchema.toSQL());
console.log('');

console.log('2. Table with constraints and defaults');
console.log('─'.repeat(60));

const constraintsSchema = schema()
  .table('users', t => {
    t.id();
    t.string('name', 100).notNull();
    t.string('email', 255).unique().notNull();
    t.integer('age');
    t.boolean('active').default(true);
    t.string('role', 50).default('user');
    t.timestamp('created_at').notNull();
    t.timestamp('updated_at');
  });

console.log(constraintsSchema.toSQL());
console.log('');

console.log('3. Blog system schema (users, posts, comments)');
console.log('─'.repeat(60));

const blogSchema = schema()
  .table('users', t => {
    t.id();
    t.string('username', 50).unique().notNull();
    t.string('email').unique().notNull();
    t.string('password_hash', 255).notNull();
    t.string('full_name', 100);
    t.text('bio');
    t.boolean('is_admin').default(false);
    t.boolean('active').default(true);
    t.timestamp('created_at').notNull();
    t.timestamp('last_login');
    t.index('email');
    t.index('username');
    t.index('active');
  })
  .table('posts', t => {
    t.id();
    t.integer('user_id').notNull();
    t.string('title', 200).notNull();
    t.string('slug', 250).unique().notNull();
    t.text('content').notNull();
    t.text('excerpt');
    t.string('featured_image', 500);
    t.boolean('published').default(false);
    t.timestamp('published_at');
    t.integer('view_count').default(0);
    t.timestamp('created_at').notNull();
    t.timestamp('updated_at');
    t.index('user_id');
    t.index('slug');
    t.index('published', 'published_at');
  })
  .table('comments', t => {
    t.id();
    t.integer('post_id').notNull();
    t.integer('user_id').notNull();
    t.integer('parent_id'); // for nested comments
    t.text('content').notNull();
    t.boolean('approved').default(false);
    t.timestamp('created_at').notNull();
    t.timestamp('updated_at');
    t.index('post_id');
    t.index('user_id');
    t.index('parent_id');
    t.index('approved', 'created_at');
  });

console.log(blogSchema.toSQL());
console.log('');

console.log('4. E-commerce schema (products, orders, etc.)');
console.log('─'.repeat(60));

const ecommerceSchema = schema()
  .table('categories', t => {
    t.id();
    t.string('name', 100).unique().notNull();
    t.string('slug', 100).unique().notNull();
    t.text('description');
    t.integer('parent_id'); // for nested categories
    t.integer('sort_order').default(0);
    t.boolean('active').default(true);
    t.index('slug');
    t.index('parent_id');
  })
  .table('products', t => {
    t.id();
    t.integer('category_id').notNull();
    t.string('sku', 50).unique().notNull();
    t.string('name', 200).notNull();
    t.text('description');
    t.integer('price').notNull(); // in cents
    t.integer('compare_at_price'); // original price
    t.integer('stock_quantity').default(0);
    t.integer('weight'); // in grams
    t.boolean('in_stock').default(true);
    t.boolean('active').default(true);
    t.timestamp('created_at').notNull();
    t.timestamp('updated_at');
    t.index('category_id');
    t.index('sku');
    t.index('active', 'in_stock');
  })
  .table('customers', t => {
    t.id();
    t.string('email').unique().notNull();
    t.string('first_name', 100);
    t.string('last_name', 100);
    t.string('phone', 20);
    t.boolean('accepts_marketing').default(false);
    t.timestamp('created_at').notNull();
    t.timestamp('updated_at');
    t.index('email');
  })
  .table('orders', t => {
    t.id();
    t.integer('customer_id').notNull();
    t.string('order_number', 50).unique().notNull();
    t.string('status', 50).notNull(); // pending, paid, shipped, delivered, cancelled
    t.integer('subtotal').notNull();
    t.integer('tax');
    t.integer('shipping');
    t.integer('total').notNull();
    t.string('currency', 3).default('USD');
    t.string('payment_method', 50);
    t.timestamp('paid_at');
    t.timestamp('shipped_at');
    t.timestamp('delivered_at');
    t.timestamp('created_at').notNull();
    t.index('customer_id');
    t.index('order_number');
    t.index('status');
    t.index('created_at');
  })
  .table('order_items', t => {
    t.id();
    t.integer('order_id').notNull();
    t.integer('product_id').notNull();
    t.string('product_name', 200).notNull(); // snapshot of name at time of order
    t.integer('quantity').notNull();
    t.integer('price').notNull(); // snapshot of price at time of order
    t.integer('subtotal').notNull();
    t.index('order_id');
    t.index('product_id');
  });

console.log(ecommerceSchema.toSQL());
console.log('');

console.log('5. Social media schema');
console.log('─'.repeat(60));

const socialSchema = schema()
  .table('users', t => {
    t.id();
    t.string('username', 30).unique().notNull();
    t.string('email').unique().notNull();
    t.string('display_name', 100);
    t.text('bio');
    t.string('avatar_url', 500);
    t.string('cover_url', 500);
    t.boolean('verified').default(false);
    t.boolean('private_account').default(false);
    t.timestamp('created_at').notNull();
    t.index('username');
    t.index('email');
  })
  .table('posts', t => {
    t.id();
    t.integer('user_id').notNull();
    t.text('content');
    t.string('image_url', 500);
    t.integer('like_count').default(0);
    t.integer('comment_count').default(0);
    t.integer('share_count').default(0);
    t.timestamp('created_at').notNull();
    t.index('user_id');
    t.index('created_at');
  })
  .table('follows', t => {
    t.id();
    t.integer('follower_id').notNull();
    t.integer('following_id').notNull();
    t.timestamp('created_at').notNull();
    t.uniqueIndex('follower_id', 'following_id'); // prevent duplicate follows
    t.index('follower_id');
    t.index('following_id');
  })
  .table('likes', t => {
    t.id();
    t.integer('user_id').notNull();
    t.integer('post_id').notNull();
    t.timestamp('created_at').notNull();
    t.uniqueIndex('user_id', 'post_id'); // one like per user per post
    t.index('post_id');
  });

console.log(socialSchema.toSQL());
console.log('');

console.log('✅ All schema examples completed!\n');
console.log('💡 Key Features Demonstrated:');
console.log('   - Expressive DSL for table definitions');
console.log('   - Method chaining for constraints');
console.log('   - Clear column types');
console.log('   - Indexes and unique constraints');
console.log('   - Defaults and nullable fields');
console.log('   - Related tables with foreign key patterns');
console.log('   - Real-world schema examples');
console.log('');
console.log('🎯 Benefits of this approach:');
console.log('   ✓ Reads like documentation');
console.log('   ✓ Self-documenting code');
console.log('   ✓ Type-safe (can be extended with TypeScript)');
console.log('   ✓ Easy to migrate between databases');
console.log('   ✓ Version control friendly');
