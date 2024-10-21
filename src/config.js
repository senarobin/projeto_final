const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',  
    password: 'Robin$0nn', 
    database: 'login_cadastro' 
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL');
    
    connection.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('Erro ao executar query de teste:', err);
        } else {
            console.log('Query de teste executada com sucesso');
        }
    });
});

module.exports = connection;