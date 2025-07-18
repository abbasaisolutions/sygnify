const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '..', 'sygnify_analytics.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

async function createDefaultUser() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Check if user already exists
        db.get("SELECT * FROM users WHERE email = ?", ['admin@sygnify.com'], (err, row) => {
            if (err) {
                console.error('Error checking user:', err);
                return;
            }
            
            if (row) {
                console.log('Default user already exists!');
                console.log('Email: admin@sygnify.com');
                console.log('Password: admin123');
                db.close();
                return;
            }
            
            // Create the user
            const sql = `
                INSERT INTO users (email, password, name, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
            `;
            
            db.run(sql, ['admin@sygnify.com', hashedPassword, 'Admin User', 'admin'], function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                } else {
                    console.log('✅ Default user created successfully!');
                    console.log('Email: admin@sygnify.com');
                    console.log('Password: admin123');
                    console.log('User ID:', this.lastID);
                }
                db.close();
            });
        });
        
    } catch (error) {
        console.error('Error:', error);
        db.close();
    }
}

// Check if users table exists first
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
        console.error('Error checking table:', err);
        db.close();
        return;
    }
    
    if (!row) {
        console.log('Users table does not exist. Creating it...');
        
        const createTableSQL = `
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        db.run(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                db.close();
                return;
            }
            console.log('Users table created successfully!');
            createDefaultUser();
        });
    } else {
        console.log('Users table exists. Creating default user...');
        createDefaultUser();
    }
}); 