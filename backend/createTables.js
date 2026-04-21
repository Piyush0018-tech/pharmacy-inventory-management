const pool = require('./db');

const createTables = async () => {
  try {

    // 1. USERS — stores admin and staff accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        full_name  VARCHAR(100) NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        role       VARCHAR(20)  DEFAULT 'Staff',
        status     VARCHAR(20)  DEFAULT 'Active',
        created_at TIMESTAMP    DEFAULT NOW()
      )
    `);
    console.log('✅ users table ready');

    // 2. MEDICINES — stores all medicine details
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(150) NOT NULL,
        category    VARCHAR(100),
        quantity    INTEGER      DEFAULT 0,
        min_stock   INTEGER      DEFAULT 50,
        price       NUMERIC(10,2) NOT NULL,
        expiry_date VARCHAR(20),
        created_at  TIMESTAMP    DEFAULT NOW()
      )
    `);
    console.log('✅ medicines table ready');

    // 3. SUPPLIERS — stores supplier/vendor info
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(150) NOT NULL,
        contact    VARCHAR(100),
        address    TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ suppliers table ready');

    // 4. PURCHASES — one row per purchase order
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id           SERIAL PRIMARY KEY,
        supplier_id  INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        order_date   DATE          NOT NULL,
        total_amount NUMERIC(12,2) DEFAULT 0,
        status       VARCHAR(20)   DEFAULT 'Pending',
        created_at   TIMESTAMP     DEFAULT NOW()
      )
    `);
    console.log('✅ purchases table ready');

    // 5. PURCHASE ITEMS — medicines inside each purchase order
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id          SERIAL PRIMARY KEY,
        purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
        medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
        quantity    INTEGER       NOT NULL,
        unit_price  NUMERIC(10,2) NOT NULL,
        total       NUMERIC(12,2) NOT NULL
      )
    `);
    console.log('✅ purchase_items table ready');

    // 6. SALES — one row per sale/invoice
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id             SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50)   UNIQUE NOT NULL,
        customer_name  VARCHAR(100)  DEFAULT 'Walk-in Customer',
        customer_phone VARCHAR(20),
        subtotal       NUMERIC(12,2) DEFAULT 0,
        tax            NUMERIC(10,2) DEFAULT 0,
        discount       NUMERIC(10,2) DEFAULT 0,
        total          NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(50)   DEFAULT 'Cash',
        status         VARCHAR(20)   DEFAULT 'Paid',
        created_at     TIMESTAMP     DEFAULT NOW()
      )
    `);
    console.log('✅ sales table ready');

    // 7. SALE ITEMS — medicines inside each sale
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id          SERIAL PRIMARY KEY,
        sale_id     INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
        quantity    INTEGER       NOT NULL,
        unit_price  NUMERIC(10,2) NOT NULL,
        total       NUMERIC(12,2) NOT NULL
      )
    `);
    console.log('✅ sale_items table ready');

    console.log('\n🎉 All tables created successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTables();