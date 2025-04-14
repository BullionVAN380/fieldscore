import { pool } from './index';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initializeDatabase() {
  try {
    // Read schema.sql
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    console.log('Creating tables...');
    await pool.query(schemaSQL);
    console.log('Tables created successfully');

    // Read seed.sql
    const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
    console.log('Seeding database...');
    await pool.query(seedSQL);
    console.log('Database seeded successfully');

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
