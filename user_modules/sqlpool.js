var mysql = require('mysql');

var pool  = mysql.createPool({
    host     : 'http://13.127.228.42:57619/phpmyadmin/',
    user     : 'user1',
    password : '12345678',
    database : 'fb1'
});

//local mysql database pool
// var pool  = mysql.createPool({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'mysqlserver@1234',
//     database : 'farmerbuddy'
// });

exports.pool = pool;
