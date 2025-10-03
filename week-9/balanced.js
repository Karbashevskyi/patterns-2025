/**
 * Week 9: Balanced Approach (Best of Both Worlds)
 * 
 * This implementation combines:
 * ✅ Expressive DSL (from Pragmatic)
 * ✅ Proper responsibility assignment (from Enterprise)
 * ✅ Clear separation of concerns
 * ✅ Single responsibility per component
 * ✅ Easy to test
 * ✅ Easy to extend
 * ✅ NO unnecessary abstractions
 * ✅ Clear business logic flow
 * 
 * STRATEGY:
 * - Fluent API for expressiveness
 * - Separate components for different responsibilities
 * - Minimal but sufficient abstraction
 * - Composition over inheritance
 * - No factories/DI unless needed
 */

// ============================================================================
// VALUE FORMATTER (Single Responsibility: Format values for SQL)
// ============================================================================

class ValueFormatter {
  static format(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    if (Array.isArray(value)) {
      return `(${value.map(v => this.format(v)).join(', ')})`;
    }
    return String(value);
  }
}

// ============================================================================
// WHERE CLAUSE (Single Responsibility: Build WHERE conditions)
// ============================================================================

class WhereClause {
  constructor() {
    this.conditions = [];
  }

  add(field, operator, value, logic = 'AND') {
    this.conditions.push({
      field,
      operator,
      value: ValueFormatter.format(value),
      logic,
    });
    return this;
  }

  addRaw(sql, logic = 'AND') {
    this.conditions.push({ raw: sql, logic });
    return this;
  }

  isEmpty() {
    return this.conditions.length === 0;
  }

  toSQL() {
    if (this.isEmpty()) return '';

    const parts = this.conditions.map((condition, index) => {
      const clause = condition.raw
        ? condition.raw
        : `${condition.field} ${condition.operator} ${condition.value}`;
      
      return index === 0 ? clause : `${condition.logic} ${clause}`;
    });

    return `WHERE ${parts.join(' ')}`;
  }
}

// ============================================================================
// QUERY BUILDER (Single Responsibility: Build SELECT queries)
// ============================================================================

class QueryBuilder {
  constructor(executor = null) {
    this.executor = executor || new QueryExecutor();
    this._select = [];
    this._from = null;
    this._where = new WhereClause();
    this._joins = [];
    this._orderBy = [];
    this._groupBy = [];
    this._having = new WhereClause();
    this._limit = null;
    this._offset = null;
  }

  // ---- SELECT ----
  select(...fields) {
    this._select.push(...fields);
    return this;
  }

  // ---- FROM ----
  from(table) {
    this._from = table;
    return this;
  }

  // ---- WHERE ----
  where(field, operator, value) {
    this._where.add(field, operator, value, 'AND');
    return this;
  }

  orWhere(field, operator, value) {
    this._where.add(field, operator, value, 'OR');
    return this;
  }

  whereRaw(sql) {
    this._where.addRaw(sql, 'AND');
    return this;
  }

  // Convenience methods (expressive!)
  whereId(id) {
    return this.where('id', '=', id);
  }

  whereIn(field, values) {
    return this.where(field, 'IN', values);
  }

  whereLike(field, pattern) {
    return this.where(field, 'LIKE', pattern);
  }

  whereNull(field) {
    this._where.add(field, 'IS', null, 'AND');
    return this;
  }

  whereNotNull(field) {
    this._where.addRaw(`${field} IS NOT NULL`, 'AND');
    return this;
  }

  // ---- JOIN ----
  join(table, leftField, operator, rightField, type = 'INNER') {
    this._joins.push({ table, leftField, operator, rightField, type });
    return this;
  }

  leftJoin(table, leftField, operator, rightField) {
    return this.join(table, leftField, operator, rightField, 'LEFT');
  }

  rightJoin(table, leftField, operator, rightField) {
    return this.join(table, leftField, operator, rightField, 'RIGHT');
  }

  // ---- ORDER BY ----
  orderBy(field, direction = 'ASC') {
    this._orderBy.push({ field, direction: direction.toUpperCase() });
    return this;
  }

  // ---- GROUP BY ----
  groupBy(...fields) {
    this._groupBy.push(...fields);
    return this;
  }

  // ---- HAVING ----
  having(field, operator, value) {
    this._having.add(field, operator, value, 'AND');
    return this;
  }

  // ---- LIMIT & OFFSET ----
  limit(value) {
    this._limit = value;
    return this;
  }

  offset(value) {
    this._offset = value;
    return this;
  }

  // ---- BUILD SQL ----
  toSQL() {
    if (!this._from) {
      throw new Error('FROM clause is required');
    }

    const parts = [];

    // SELECT
    const selectClause = this._select.length === 0
      ? 'SELECT *'
      : `SELECT ${this._select.join(', ')}`;
    parts.push(selectClause);

    // FROM
    parts.push(`FROM ${this._from}`);

    // JOINS
    this._joins.forEach(join => {
      parts.push(
        `${join.type} JOIN ${join.table} ON ${join.leftField} ${join.operator} ${join.rightField}`
      );
    });

    // WHERE
    const whereClause = this._where.toSQL();
    if (whereClause) parts.push(whereClause);

    // GROUP BY
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }

    // HAVING
    const havingClause = this._having.toSQL().replace('WHERE', 'HAVING');
    if (havingClause) parts.push(havingClause);

    // ORDER BY
    if (this._orderBy.length > 0) {
      const orders = this._orderBy.map(o => `${o.field} ${o.direction}`);
      parts.push(`ORDER BY ${orders.join(', ')}`);
    }

    // LIMIT
    if (this._limit !== null) {
      parts.push(`LIMIT ${this._limit}`);
    }

    // OFFSET
    if (this._offset !== null) {
      parts.push(`OFFSET ${this._offset}`);
    }

    return parts.join(' ');
  }

  // ---- EXECUTION ----
  async execute() {
    const sql = this.toSQL();
    return await this.executor.execute(sql);
  }

  async first() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }

  async get() {
    return await this.execute();
  }

  async pluck(field) {
    const results = await this.execute();
    return results.map(row => row[field]);
  }

  async count() {
    this._select = ['COUNT(*) as count'];
    const results = await this.execute();
    return results[0]?.count || 0;
  }
}

// ============================================================================
// QUERY EXECUTOR (Single Responsibility: Execute queries)
// ============================================================================

class QueryExecutor {
  constructor(connection = null) {
    this.connection = connection;
  }

  async execute(sql) {
    console.log('Balanced: Executing:', sql);
    
    // In real implementation, use actual database connection
    // For now, mock the execution
    return this._mockExecute(sql);
  }

  async _mockExecute(sql) {
    // Simulate database call
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Mock data
    return [
      { id: 1, name: 'John', email: 'john@example.com', age: 25, active: true },
      { id: 2, name: 'Jane', email: 'jane@example.com', age: 30, active: true },
      { id: 3, name: 'Bob', email: 'bob@example.com', age: 35, active: false },
    ];
  }
}

// ============================================================================
// SCHEMA BUILDER (Single Responsibility: Define database schema)
// ============================================================================

class ColumnDefinition {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.constraints = [];
  }

  primaryKey() {
    this.constraints.push('PRIMARY KEY');
    return this;
  }

  autoIncrement() {
    this.constraints.push('AUTO_INCREMENT');
    return this;
  }

  notNull() {
    this.constraints.push('NOT NULL');
    return this;
  }

  nullable() {
    // Remove NOT NULL if exists
    this.constraints = this.constraints.filter(c => c !== 'NOT NULL');
    return this;
  }

  unique() {
    this.constraints.push('UNIQUE');
    return this;
  }

  default(value) {
    this.constraints.push(`DEFAULT ${ValueFormatter.format(value)}`);
    return this;
  }

  toSQL() {
    const parts = [this.name, this.type, ...this.constraints];
    return parts.join(' ');
  }
}

class TableDefinition {
  constructor(name) {
    this.name = name;
    this.columns = [];
    this.indexes = [];
  }

  // Column types
  id(name = 'id') {
    const col = new ColumnDefinition(name, 'INTEGER');
    col.primaryKey().autoIncrement();
    this.columns.push(col);
    return col;
  }

  string(name, length = 255) {
    const col = new ColumnDefinition(name, `VARCHAR(${length})`);
    this.columns.push(col);
    return col;
  }

  integer(name) {
    const col = new ColumnDefinition(name, 'INTEGER');
    this.columns.push(col);
    return col;
  }

  boolean(name) {
    const col = new ColumnDefinition(name, 'BOOLEAN');
    this.columns.push(col);
    return col;
  }

  text(name) {
    const col = new ColumnDefinition(name, 'TEXT');
    this.columns.push(col);
    return col;
  }

  date(name) {
    const col = new ColumnDefinition(name, 'DATE');
    this.columns.push(col);
    return col;
  }

  timestamp(name) {
    const col = new ColumnDefinition(name, 'TIMESTAMP');
    this.columns.push(col);
    return col;
  }

  // Indexes
  index(...fields) {
    this.indexes.push({ fields, type: 'INDEX' });
    return this;
  }

  uniqueIndex(...fields) {
    this.indexes.push({ fields, type: 'UNIQUE INDEX' });
    return this;
  }

  toSQL() {
    const columnDefs = this.columns.map(col => `  ${col.toSQL()}`);
    
    const indexDefs = this.indexes.map((idx, i) => {
      const indexName = `idx_${this.name}_${idx.fields.join('_')}`;
      return `  ${idx.type} ${indexName} (${idx.fields.join(', ')})`;
    });

    const allDefs = [...columnDefs, ...indexDefs];
    
    return `CREATE TABLE ${this.name} (\n${allDefs.join(',\n')}\n);`;
  }
}

class SchemaBuilder {
  constructor() {
    this.tables = new Map();
  }

  table(name, callback) {
    const table = new TableDefinition(name);
    callback(table);
    this.tables.set(name, table);
    return this;
  }

  getTable(name) {
    return this.tables.get(name);
  }

  toSQL() {
    return Array.from(this.tables.values())
      .map(table => table.toSQL())
      .join('\n\n');
  }
}

// ============================================================================
// FACTORY FUNCTIONS (Simple, no over-engineering)
// ============================================================================

function query(executor) {
  return new QueryBuilder(executor);
}

function schema() {
  return new SchemaBuilder();
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function balancedExample() {
  console.log('\n=== BALANCED APPROACH ===\n');

  // --- Schema Definition (Expressive!) ---
  console.log('--- Schema Definition ---\n');
  
  const db = schema()
    .table('users', t => {
      t.id();
      t.string('name').notNull();
      t.string('email').unique().notNull();
      t.integer('age');
      t.boolean('active').default(true);
      t.timestamp('created_at').notNull();
      t.index('email');
      t.index('active', 'created_at');
    })
    .table('posts', t => {
      t.id();
      t.integer('user_id').notNull();
      t.string('title', 200).notNull();
      t.text('content');
      t.timestamp('published_at').nullable();
      t.index('user_id');
      t.index('published_at');
    });

  console.log(db.toSQL());

  // --- Query Examples (Expressive and clean!) ---
  console.log('\n--- Query Examples ---\n');

  // Simple query
  const users = await query()
    .select('id', 'name', 'email')
    .from('users')
    .where('age', '>', 18)
    .where('active', '=', true)
    .orderBy('name', 'ASC')
    .limit(10)
    .get();

  console.log('Active adult users:', users);

  // Complex query with join
  const postsWithAuthors = await query()
    .select('posts.*', 'users.name as author_name', 'users.email as author_email')
    .from('posts')
    .leftJoin('users', 'posts.user_id', '=', 'users.id')
    .whereNotNull('posts.published_at')
    .orderBy('posts.published_at', 'DESC')
    .limit(5)
    .get();

  console.log('Recent posts with authors:', postsWithAuthors);

  // Convenience methods
  const user = await query()
    .from('users')
    .whereId(1)
    .first();

  console.log('Single user:', user);

  const emails = await query()
    .from('users')
    .whereIn('id', [1, 2, 3])
    .pluck('email');

  console.log('User emails:', emails);

  // Aggregation
  const activeCount = await query()
    .from('users')
    .where('active', '=', true)
    .count();

  console.log('Active users count:', activeCount);

  console.log('\n--- Analysis ---');
  console.log('✅ Expressive DSL (readable business logic)');
  console.log('✅ Proper separation of concerns');
  console.log('✅ Single responsibility per class');
  console.log('✅ Easy to test each component');
  console.log('✅ Easy to extend');
  console.log('✅ No unnecessary abstractions');
  console.log('Files needed: 1-2 files (this file + tests)');
  console.log('Lines of code: ~400 for full functionality');
  console.log('Complexity: Just right!');
}

// Export for comparison
export {
  QueryBuilder,
  SchemaBuilder,
  QueryExecutor,
  ValueFormatter,
  WhereClause,
  query,
  schema,
};
