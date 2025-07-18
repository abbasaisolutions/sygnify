#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🗄️  Setting up Sygnify Analytics Hub database...\n');

async function setupDatabase() {
  let client;
  
  try {
    // Connect to PostgreSQL as superuser to create database
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: 'postgres', // Default superuser
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres' // Default database
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'sygnify_analytics']
    );

    if (dbExists.rows.length === 0) {
      console.log('📦 Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'sygnify_analytics'}`);
      console.log('✅ Database created');
    } else {
      console.log('✅ Database already exists');
    }

    await client.end();

    // Connect to the new database
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'sygnify_user',
      password: process.env.DB_PASSWORD || 'sygnify_password',
      database: process.env.DB_NAME || 'sygnify_analytics'
    });

    await client.connect();
    console.log('✅ Connected to Sygnify database');

    // Create user if it doesn't exist
    try {
      await client.query(`CREATE USER ${process.env.DB_USER || 'sygnify_user'} WITH PASSWORD '${process.env.DB_PASSWORD || 'sygnify_password'}'`);
      console.log('✅ Database user created');
    } catch (error) {
      if (error.code === '42710') { // User already exists
        console.log('✅ Database user already exists');
      } else {
        throw error;
      }
    }

    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${process.env.DB_NAME || 'sygnify_analytics'} TO ${process.env.DB_USER || 'sygnify_user'}`);
    await client.query(`GRANT ALL ON SCHEMA public TO ${process.env.DB_USER || 'sygnify_user'}`);
    console.log('✅ Privileges granted');

    // Run migrations
    console.log('\n📋 Running database migrations...');
    const migrationsDir = path.join(__dirname, '..', 'backend', 'database', 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        console.log(`   Running migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          await client.query(migrationSQL);
          console.log(`   ✅ ${file} completed`);
        } catch (error) {
          if (error.code === '42P07') { // Table already exists
            console.log(`   ⚠️  ${file} skipped (tables already exist)`);
          } else {
            console.error(`   ❌ ${file} failed:`, error.message);
            throw error;
          }
        }
      }
    } else {
      console.log('⚠️  No migrations directory found');
    }

    // Create initial data
    console.log('\n🌱 Creating initial data...');
    
    // Create default admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await client.query(`
        INSERT INTO users (email, password, name, role, tenant_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (email) DO NOTHING
      `, [
        'admin@sygnify.com',
        hashedPassword,
        'System Administrator',
        'admin',
        'default-tenant'
      ]);
      console.log('✅ Default admin user created (admin@sygnify.com / admin123)');
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        console.log('✅ Default admin user already exists');
      } else {
        console.error('❌ Failed to create admin user:', error.message);
      }
    }

    // Create sample analysis results
    try {
      await client.query(`
        INSERT INTO advanced_analysis_results (domain, data_profile, analysis_results, visualizations, narrative, analysis_depth, tenant_id, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT DO NOTHING
      `, [
        'advertising',
        JSON.stringify({
          domain: 'advertising',
          confidence: 0.85,
          structure: {
            shape: [1000, 5],
            columns: ['date', 'campaign', 'clicks', 'impressions', 'ctr']
          }
        }),
        JSON.stringify({
          avg_ctr: 2.5,
          total_clicks: 2500,
          total_impressions: 100000
        }),
        JSON.stringify({
          chart_configurations: {
            'CTR Over Time': {
              type: 'line',
              data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [{
                  label: 'CTR',
                  data: [2.1, 2.3, 2.4, 2.6, 2.5],
                  borderColor: 'rgb(75, 192, 192)'
                }]
              }
            }
          }
        }),
        JSON.stringify({
          executive_summary: 'Advertising campaign analysis shows improving CTR trends with 2.5% average click-through rate.',
          key_insights: [
            {
              category: 'Performance',
              insight: 'CTR has improved by 19% over the last 5 months',
              confidence: 0.85,
              impact: 'high'
            }
          ]
        }),
        'comprehensive',
        'default-tenant',
        'admin'
      ]);
      console.log('✅ Sample analysis results created');
    } catch (error) {
      console.log('✅ Sample data already exists or table not ready');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Database Information:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME || 'sygnify_analytics'}`);
    console.log(`   User: ${process.env.DB_USER || 'sygnify_user'}`);
    console.log('\n🔑 Default Admin Credentials:');
    console.log('   Email: admin@sygnify.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Check your .env file configuration');
      console.error('3. Ensure PostgreSQL is accessible on the configured host/port');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

setupDatabase(); 