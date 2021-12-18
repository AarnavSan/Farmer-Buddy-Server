var mysql = require('mysql');

var pool  = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'fb1'
});

// var pool  = mysql.createPool({
//     host     : 'depend-prices-captured-intelligent.trycloudflare.com',
//     user     : 'root',
//     password : '',
//     database : 'fb1'
// });
//local mysql database pool
// var pool  = mysql.createPool({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'mysqlserver@1234',
//     database : 'farmerbuddy'
// });

exports.pool = pool;
