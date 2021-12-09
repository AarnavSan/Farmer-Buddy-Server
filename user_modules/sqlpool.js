var mysql = require('mysql');

var pool  = mysql.createPool({
    host     : 'sql6.freemysqlhosting.net',
    user     : 'sql6448413',
    password : '1KFZdpme7v',
    database : 'sql6448413'
});

//local mysql database pool
// var pool  = mysql.createPool({
//     host     : 'localhost',
//     user     : 'root',
//     password : 'mysqlserver@1234',
//     database : 'farmerbuddy'
// });

exports.pool = pool;