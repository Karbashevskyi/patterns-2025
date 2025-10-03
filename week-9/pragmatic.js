/**
 * Week 9: Pragmatic Approach (Too Simple)
 * 
 * This implementation shows:
 * - Minimal abstraction
 * - Direct implementation
 * - Expressive DSL
 * - Mixed concerns
 * 
 * PROBLEMS:
 * - Breaks Separation of Concerns
 * - Violates Single Responsibility Principle
 * - Hard to test in isolation
 * - Tight coupling
 * - Business logic mixed with infrastructure
 * 
 * BENEFITS:
 * - Very expressive and readable
 * - Quick to write
 * - Easy to understand
 * - Low cognitive overhead
 */

// ============================================================================
// ALL-IN-ONE QUERY BUILDER (Mixing everything)
// ============================================================================

class Query {
  constructor() {
    this._select = [];
    this._from = null;
    this._where = [];
    this._joins = [];
    this._orderBy = [];
    this._limit = null;
    this._offset = null;
    this._groupBy = [];
    this._having = [];
  }

  // SELECT clause - mixes query building and formatting
  select(...fields) {
    this._select = fields;
    return this;
  }

  // FROM clause
  from(table) {
    this._from = table;
    return this;
  }

  // WHERE clause - handles formatting inline
  where(field, operator, value) {
    // Mixing formatting logic here (bad SoC)
    const formatted = this._formatValue(value);
    this._where.push({ field, operator, value: formatted, logic: 'AND' });
    return this;
  }

  orWhere(field, operator, value) {
    const formatted = this._formatValue(value);
    this._where.push({ field, operator, value: formatted, logic: 'OR' });
    return this;
  }

  // Direct where with raw SQL (very pragmatic but unsafe)
  whereRaw(sql) {
    this._where.push({ raw: sql, logic: 'AND' });
    return this;
  }

  // JOIN - simple but mixed concerns
  join(table, leftField, rightField) {
    this._joins.push({ type: 'INNER', table, leftField, rightField });
    return this;
  }

  leftJoin(table, leftField, rightField) {
    this._joins.push({ type: 'LEFT', table, leftField, rightField });
    return this;
  }

  // ORDER BY
  orderBy(field, direction = 'ASC') {
    this._orderBy.push({ field, direction });
    return this;
  }

  // GROUP BY
  groupBy(...fields) {
    this._groupBy = fields;
    return this;
  }

  // HAVING
  having(field, operator, value) {
    const formatted = this._formatValue(value);
    this._having.push({ field, operator, value: formatted });
    return this;
  }

  // LIMIT and OFFSET
  limit(value) {
    this._limit = value;
    return this;
  }

  offset(value) {
    this._offset = value;
    return this;
  }

  // Convenience methods (mixing concerns but very expressive)
  whereId(id) {
    return this.where('id', '=', id);
  }

  whereIn(field, values) {
    const formatted = values.map(v => this._formatValue(v)).join(', ');
    this._where.push({ field, operator: 'IN', value: `(${formatted})`, logic: 'AND' });
    return this;
  }

  whereLike(field, pattern) {
    return this.where(field, 'LIKE', pattern);
  }

  whereNull(field) {
    this._where.push({ field, operator: 'IS', value: 'NULL', logic: 'AND' });
    return this;
  }

  whereNotNull(field) {
    this._where.push({ field, operator: 'IS NOT', value: 'NULL', logic: 'AND' });
    return this;
  }

  // Value formatting (mixing infrastructure with business logic)
  _formatValue(value) {
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
    return String(value);
  }

  // Build query (mixing parsing, validation, and string building)
  toSQL() {
    const parts = [];

    // SELECT
    if (this._select.length === 0) {
      parts.push('SELECT *');
    } else {
      parts.push(`SELECT ${this._select.join(', ')}`);
    }

    // FROM
    if (!this._from) {
      throw new Error('FROM clause is required');
    }
    parts.push(`FROM ${this._from}`);

    // JOINS
    if (this._joins.length > 0) {
      this._joins.forEach(j => {
        parts.push(`${j.type} JOIN ${j.table} ON ${j.leftField} = ${j.rightField}`);
      });
    }

    // WHERE
    if (this._where.length > 0) {
      const conditions = this._where.map((w, i) => {
        if (w.raw) {
          return i === 0 ? w.raw : `${w.logic} ${w.raw}`;
        }
        const condition = `${w.field} ${w.operator} ${w.value}`;
        return i === 0 ? condition : `${w.logic} ${condition}`;
      });
      parts.push(`WHERE ${conditions.join(' ')}`);
    }

    // GROUP BY
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }

    // HAVING
    if (this._having.length > 0) {
      const conditions = this._having.map(h => `${h.field} ${h.operator} ${h.value}`);
      parts.push(`HAVING ${conditions.join(' AND ')}`);
    }

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

  // Execute - mixing query execution with query building (bad SRP)
  async execute() {
    const sql = this.toSQL();
    console.log('Pragmatic: Executing:', sql);

    // Directly executing here (no separation of concerns)
    // In real app, this would call database directly
    return this._mockExecute(sql);
  }

  async first() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }

  async get() {
    return await this.execute();
  }

  // Mock execution (mixing data access layer)
  async _mockExecute(sql) {
    // Simulate database call
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return [
      { id: 1, name: 'John', email: 'john@example.com', age: 25 },
      { id: 2, name: 'Jane', email: 'jane@example.com', age: 30 },
    ];
  }

  // Result transformation (mixing ORM concerns)
  async map(fn) {
    const results = await this.execute();
    return results.map(fn);
  }

  async pluck(field) {
    const results = await this.execute();
    return results.map(r => r[field]);
  }

  async count() {
    this._select = ['COUNT(*) as count'];
    const results = await this.execute();
    return results[0]?.count || 0;
  }
}

// ============================================================================
// SCHEMA DEFINITION (Mixing schema with validation and formatting)
// ============================================================================

class Schema {
  constructor() {
    this.tables = {};
  }

  // Define table (mixing schema definition with validation)
  table(name, callback) {
    const table = new Table(name);
    callback(table);
    this.tables[name] = table;
    return this;
  }

  // Get table
  getTable(name) {
    return this.tables[name];
  }

  // Generate CREATE TABLE SQL (mixing schema with SQL generation)
  toSQL() {
    return Object.values(this.tables)
      .map(table => table.toSQL())
      .join('\n\n');
  }
}

class Table {
  constructor(name) {
    this.name = name;
    this.columns = [];
    this.indexes = [];
    this.primaryKey = null;
  }

  // Column definitions (mixing types, constraints, and formatting)
  id() {
    this.columns.push({ name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true });
    this.primaryKey = 'id';
    return this;
  }

  string(name, length = 255) {
    this.columns.push({ name, type: `VARCHAR(${length})` });
    return this;
  }

  integer(name) {
    this.columns.push({ name, type: 'INTEGER' });
    return this;
  }

  boolean(name) {
    this.columns.push({ name, type: 'BOOLEAN' });
    return this;
  }

  date(name) {
    this.columns.push({ name, type: 'DATE' });
    return this;
  }

  timestamp(name) {
    this.columns.push({ name, type: 'TIMESTAMP' });
    return this;
  }

  text(name) {
    this.columns.push({ name, type: 'TEXT' });
    return this;
  }

  // Constraints (mixing)
  nullable() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.nullable = true;
    return this;
  }

  notNullable() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.nullable = false;
    return this;
  }

  defaultValue(value) {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.default = value;
    return this;
  }

  unique() {
    const lastColumn = this.columns[this.columns.length - 1];
    lastColumn.unique = true;
    return this;
  }

  // Indexes
  index(fields) {
    this.indexes.push({ fields: Array.isArray(fields) ? fields : [fields] });
    return this;
  }

  // Generate CREATE TABLE (mixing schema definition with SQL generation)
  toSQL() {
    const columnDefs = this.columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement) def += ' AUTO_INCREMENT';
      if (col.nullable === false) def += ' NOT NULL';
      if (col.default !== undefined) def += ` DEFAULT ${col.default}`;
      if (col.unique) def += ' UNIQUE';
      
      return def;
    });

    const indexDefs = this.indexes.map((idx, i) => {
      return `  INDEX idx_${this.name}_${i} (${idx.fields.join(', ')})`;
    });

    const allDefs = [...columnDefs, ...indexDefs];

    return `CREATE TABLE ${this.name} (\n${allDefs.join(',\n')}\n);`;
  }
}

// ============================================================================
// HELPER FUNCTIONS (Direct and expressive but mixing concerns)
// ============================================================================

function query() {
  return new Query();
}

function schema() {
  return new Schema();
}

// Ultra-short aliases (pragmatic but can be confusing)
const q = query;
const s = schema;

// ============================================================================
// USAGE (Very expressive and readable!)
// ============================================================================

export async function pragmaticExample() {
  console.log('\n=== PRAGMATIC APPROACH ===\n');

  // Schema definition - VERY expressive!
  const db = schema()
    .table('users', t => {
      t.id();
      t.string('name').notNullable();
      t.string('email').unique().notNullable();
      t.integer('age');
      t.boolean('active').defaultValue(true);
      t.timestamp('created_at').notNullable();
      t.index('email');
    })
    .table('posts', t => {
      t.id();
      t.integer('user_id').notNullable();
      t.string('title').notNullable();
      t.text('content');
      t.timestamp('published_at');
      t.index('user_id');
    });

  console.log('Schema SQL:');
  console.log(db.toSQL());

  // Query - VERY expressive!
  console.log('\n--- Query Examples ---\n');

  const users = await query()
    .select('id', 'name', 'email')
    .from('users')
    .where('age', '>', 18)
    .where('active', '=', true)
    .orderBy('name', 'ASC')
    .limit(10)
    .get();

  console.log('Users:', users);

  // More complex query
  const posts = await query()
    .select('posts.*', 'users.name as author')
    .from('posts')
    .join('users', 'posts.user_id', 'users.id')
    .where('posts.published_at', 'IS NOT', null)
    .orderBy('posts.published_at', 'DESC')
    .limit(5)
    .get();

  console.log('Posts:', posts);

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

  console.log('Emails:', emails);

  console.log('\nNotice: Very readable and expressive!');
  console.log('Files needed: 1 file');
  console.log('Lines of code: ~300 for full functionality');
  console.log('BUT: Everything is mixed together!');
}

// Export for comparison
export { Query, Schema, query, schema, q, s };
