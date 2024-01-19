// const mysql = require('mysql');

// // Configuración de la conexión a la base de datos
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '123456',
//   database: 'rol'
// });

// // Establecer conexión a la base de datos
// connection.connect((err) => {
//   if (err) {
//     console.error('Error de conexión: ' + err.stack);
//     return;
//   }

//   console.log('Conexión exitosa con ID ' + connection.threadId);

//   // Puedes realizar consultas u otras operaciones aquí

//   // Cerrar la conexión cuando hayas terminado de usarla
//   connection.end();
// });
// db.js
const mysql = require('mysql2/promise'); // Importar mysql2 con soporte de promesas

const dbConfig = {
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'c21HBC1HeCBB6gGacD21E21df4H-FHga',
    port: 37812,
    database: 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
    //   host: 'localhost',
    // user: 'root',
    // password: '123456',
    // port: 3306,
    // database: 'rol'
};

async function getConnection() {
    return await mysql.createConnection(dbConfig);
}

module.exports = getConnection;
