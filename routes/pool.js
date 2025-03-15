const mysql = require('mysql')
var pool = mysql.createPool({

    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'admin',
    multipleStatements: true,
    connectionLimit: 1000
})

module.exports = pool