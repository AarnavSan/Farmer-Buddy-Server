var mysql = require('mysql');

var pool  = mysql.createPool({
    host     : 'sql6.freemysqlhosting.net',
    user     : 'sql6443226',
    password : 'WSi3XwhR6n',
    database : 'sql6443226'
});

exports.pool = pool;