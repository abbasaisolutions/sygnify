const bcrypt = require('bcrypt');
const sqlite3 = require('better-sqlite3');
const path = require('path');

async function createDefaultUser() {
  try {
    // Connect to the database
    const dbPath = path.join(__dirname, '../backend/sygnify_analytics.db');
    const db = sqlite3(dbPath);
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    
    if (existingUser) {
      console.log('Default user "admin" already exists!');
      return;
    }
    
    // Create default user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const insert = db.prepare(
      'INSERT INTO users (username, password, tenant_id, subscription_status) VALUES (?, ?, ?, ?)'
    );
    
    insert.run('admin', hashedPassword, 'default', 'active');
    
    console.log('✅ Default user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('You can now log in with these credentials.');
    
    db.close();
  } catch (error) {
    console.error('❌ Error creating default user:', error);
  }
}

createDefaultUser(); 