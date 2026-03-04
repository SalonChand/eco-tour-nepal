const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create the connection to database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect and test
db.connect((err) => {
    if (err) {
        console.error('❌ MySQL Connection Failed:', err.message);
        console.log('👉 Make sure XAMPP/MySQL is running and the database exists!');
    } else {
        console.log('✅ Connected to MySQL Database successfully!');
    }
});

module.exports = db;