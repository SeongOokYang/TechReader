let mysql = require('mysql');
let conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yso3818!',
    database: 'o2'
});

conn.connect();
conn.query('SELECT * FROM topic', function(err, rows, fields) {
    if(err) {
        console.log(err);
    }else {
        console.log('rows', rows);
        console.log('fields', fields);
    }
});

conn.end();