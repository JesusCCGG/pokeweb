const express = require('express');
const bodyParser = require('body-parser');
const getConnection = require('./db'); // Importar la función de conexión
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/"));


let connection; // Declara la variable connection aquí

// Inicializar la conexión
connection = getConnection();


const validarToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    jwt.verify(token, 'mi_clave_secreta', (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensaje: 'Token inválido' });
        }

        res.locals.usuario = decoded.usuario;
        res.locals.id_cargo = decoded.id_cargo;
        next();
    });
};

const validarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        const id_cargo = res.locals.id_cargo;
        if (rolesPermitidos.includes(id_cargo)) {
            next();
        } else {
            res.status(403).send('Acceso denegado. No tienes permisos para ver esta página.');
        }
    };
};

app.get('/Vista_administrador.html', validarToken, validarRol([1]), (req, res) => {
    res.sendFile(__dirname + '/Vista_administrador.html');
});

app.get('/admin', validarToken, validarRol([1]), (req, res) => {
    res.sendFile(__dirname + '/Vista_administrador.html');
});

app.get('/Vista_cliente.html', validarToken, validarRol([1]), (req, res) => {
    res.sendFile(__dirname + '/vista_cliente.html');
});

app.post('/registro', async (req, res) => {
    const { usuario, correo, contrasenia, nombre } = req.body;
    try {
        connection = await getConnection();
        // Verificar si el usuario ya existe
        const checkUserQuery = 'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?';
        const [userCount] = await connection.execute(checkUserQuery, [usuario]);
        if (userCount[0].count > 0) {
            // Si el usuario ya existe, enviar una respuesta indicando el problema
            res.write(`
                    <script>
                        window.location.href = '/registro.html';
                        alert("Usuario ya existente");
                    </script>
                `);
        } else {
            // Si el usuario no existe, realizar la inserción
            const insertQuery = 'insert into usuarios (id, nombre, usuario, contrasenia, id_cargo) VALUES (default, ?, ?, ?, 2)';
            await connection.execute(insertQuery, [nombre, usuario, contrasenia]);
            // Enviar una respuesta indicando que el registro fue exitoso
            res.write(`
                    <script>
                        window.location.href = '/index.html';
                        alert("Registro exitoso");
                    </script>
                `);
        }
    } catch (error) {
        console.error('Error en el registro: ', error);
        res.status(500).send('Error en el registro');
    } finally {
        if (connection) {
            connection.end();
        }
    }
});


app.post('/a', async (req, res) => {

    const usuario = req.body.usuario;
    const contrasenia = req.body.contrasenia;
  

    try {
        connection = await getConnection();  // Obtener la conexión

        const query = 'SELECT id_cargo FROM usuarios WHERE usuario = ? AND contrasenia = ?';
        const [results] = await connection.execute(query, [usuario, contrasenia]);

        if (results.length > 0) {
            const id_cargo = results[0].id_cargo;
  
            try {
                const token = generarToken(usuario, id_cargo);
                // Almacena el token en localStorage y redirige según el ID de cargo
                res.write(`
                    <script>
                        sessionStorage.setItem('token', "${token}");
                        sessionStorage.setItem('id_cargo', ${id_cargo});
                        window.location.href = (sessionStorage.getItem('id_cargo') == 1) ? '/admin.html' : '/Vista_cliente.html';
                    </script>
                `);
            } catch (error) {
                console.error('Error al generar el token:', error);
                res.write(`
                    <script>
                        window.location.href = '/index.html';
                        alert("ERROR EN LA AUTENTIFICACION");
                    </script>
                `);
            }        
            
        } 
        else {
            // Usuario o contraseña incorrectos
            res.sendFile(__dirname + '/index.html');
            res.write(`
                    <script>
                        window.location.href = '/index.html';
                        alert("Usuario y contraseña incorrectos");
                    </script>
                `);
        }

        res.end();
    } catch (error) {
        console.error('Error en la base de datos: ', error);
        res.sendFile(__dirname + '/index.html');
        res.write("<h1 class='bad'>Error en la autenticación</h1>");
        res.end();
    } finally {
        if (connection) {
            connection.end();
        }
    }
}); 

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

generarToken = (usuario, id_cargo) => {
    const claveSecreta = 'mi_clave_secreta';
    const payload = { usuario, id_cargo };
    const token = jwt.sign(payload, claveSecreta, { expiresIn: '1h' });
    console.log('g Token JWT:', token);
    return token;
}

            
const nodemailer = require('nodemailer'); //mandamos a llamar la libreria
// Dependencias y configuraciones previas...
// 
app.post('/b', async (req, res) => {
    const usuario = req.body.usuario;

    try {
        connection = await getConnection();

        const query = 'SELECT id_cargo FROM usuarios WHERE usuario = ?';
        const [results] = await connection.execute(query, [usuario]);

        if (results.length > 0) {
            // Usuario encontrado
            await codigoRecuperacionf(usuario, connection);
            res.sendFile(__dirname + '/index.html');
            res.write("<h1 class='bad'>Codigo de recuperacion enviado</h1> " + usuario);

            // Suponiendo que enviarMail es una función definida en otro lugar
            enviarMail(usuario);
            res.write(`
            <form action="/validar-codigo" method="post">
                <label for="codigo">Ingresa el de recuperacion:</label>
                <input type="text" id="codigo" name="codigo" required>
                <input type="hidden" name="usuario" value="${usuario}">
                <input type="submit" value="Validar">
            </form>
        `);
        } else {
            // Usuario no encontrado
            res.sendFile(__dirname + '/index.html');
            res.write("<h1 class='bad'>Usuario no existente</h1>");
        }
    } catch (error) {
        console.error('Error en la base de datos: ', error);
        res.sendFile(__dirname + '/index.html');
        res.write("<h1 class='bad'>ERROR EN LA AUTENTIFICACION</h1>");
    } finally {
        if (connection) {
            connection.end();
        }
    }
    res.end();
});
let codigoRecuperacion;
async function codigoRecuperacionf(usuario, connection) {
    codigoRecuperacion = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const sql = 'UPDATE usuarios SET contrasenia = ? WHERE usuario = ?';

    try {
        const [results] = await connection.execute(sql, [codigoRecuperacion, usuario]);
        console.log(`Contraseña actualizada para el usuario ${usuario}`);
    } catch (error) {
        throw error; // Lanza el error para manejarlo en la ruta
    }
}




enviarMail = async (usuario) => { //creamos una funcion para enviar el email
    //se crean dos objetos los cuales son de transporte y el de envio de correo 
    const config = { //especificamos los objetos que necesita nuestra libreria 
        host: 'smtp.gmail.com',
        port: 587,
        auth: {//autorizador = solicitara el usuario de la cuenta de correo y la contaseña
            user: 'jcerecedog1700@gmail.com', //iwpru3b4@gmail.com
            pass: 'tvkn mytj vcvy vpkq'//cved tzul hcct pnuj 
        }

    }
    const mensaje = { 

        from: 'jcerecedog1700@gmail.com',
        to: 'gchuysin@gmail.com',
        subject: 'Prueba de correo 9 IW - Promesas',
        text: '',
        html: '<h1>Su código de recuperacion es: </h1>\n<h2>'+codigoRecuperacion+'</h2>\n'

    }

    const transport = nodemailer.createTransport(config);//creamos un objeto el cual hara el trasporte nodemailer que es una funcion asincrona

    const info = await transport.sendMail(mensaje);//se crea una variable para la informacion del retorno se usa el metodo sendmail el cual nos pide el objeto de mensaje
    console.log(info);
    console.log(info);

}

app.get('/usuarios', async (req, res) => {
    //let connection;
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM usuarios');
        res.json(rows);
        connection.end();
});

//public: 66871a4efa9fb001fd69fe57f6b84ffc
//provate: 82b0ac6fb552afa67730c3c8ad7bfab4eab57792
//hash previo: 182b0ac6fb552afa67730c3c8ad7bfab4eab5779266871a4efa9fb001fd69fe57f6b84ffc

// Mostrar todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    let connection; // Declarar la conexión aquí

    try {
        connection = await getConnection(); // Obtener la conexión

        if (!connection || connection.state === 'disconnected') {
            throw new Error('La conexión está cerrada');
        }

        const [rows] = await connection.execute('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error('Error en el servidor al obtener usuarios:', error);
        res.status(500).send('Error en el servidor al obtener usuarios.');
    } finally {
        if (connection) {
            connection.end(); // Cerrar la conexión en el bloque 'finally'
        }
    }
});


// Agregar un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    let data = {
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        contrasenia: req.body.contrasenia,
        id_cargo: req.body.id_cargo
    };

    let connection;

    try {
        // Inicializa la conexión dentro del controlador de ruta
        connection = await getConnection();

        let sql = 'INSERT INTO usuarios SET ?';
        const [results] = await connection.query(sql, data);  // Usa 'query' en lugar de 'execute'

        res.send(results);
    } catch (error) {
        console.error('Error en el servidor al agregar el usuario:', error);
        res.status(500).send('Error en el servidor al agregar el usuario.');
    } finally {
        if (connection) {
            // Cierra la conexión después de ejecutar la consulta
            connection.end();
        }
    }
});




// Editar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    const userId = req.params.id;
    const { nombre, usuario, contrasenia, id_cargo } = req.body;

    let connection;

    try {
        connection = await getConnection();

        const [results] = await connection.execute(
            'UPDATE usuarios SET nombre=?, usuario=?, contrasenia=?, id_cargo=? WHERE id=?',
            [nombre, usuario, contrasenia, id_cargo, userId]
        );

        console.log('Usuario actualizado con éxito:', results);
        res.send(results);
    } catch (error) {
        console.error('Error en el servidor al actualizar el usuario:', error);
        res.status(500).send('Error en el servidor al actualizar el usuario.');
    } finally {
        if (connection) {
            connection.end();
        }
    }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    const userId = req.params.id;
    console.log('Eliminando usuario con ID:', userId);

    let connection;

    try {
        connection = await getConnection();

        const [results] = await connection.execute('DELETE FROM usuarios WHERE id = ?', [userId]);

        console.log('Usuario eliminado con éxito:', results);
        res.send(results);
    } catch (error) {
        console.error('Error en el servidor al eliminar el usuario:', error);
        res.status(500).send('Error en el servidor al eliminar el usuario.');
    } finally {
        if (connection) {
            connection.end();
        }
    }
});
//CAMBIAR CONTRASEÑA
app.post('/cambiar', async (req, res) => {
    const contrasenia = req.body.contrasenia;

    const usuario = req.body.usuario;

    console.log(usuario);
        console.log(contrasenia);
        console.log("****")
        
    try {
        connection = await getConnection();

        const query = 'SELECT contrasenia FROM usuarios WHERE usuario = ?';
        const [results] = await connection.execute(query, [usuario]);
        
        if (results.length > 0) {
            // Usuario encontrado
            await establecernuevaContra(contrasenia, usuario, connection);
            res.sendFile(__dirname + '/index.html');
            res.write("<h1 class='bad'>Contraseña Cambiada Exitosamente</h1> " + usuario);
            console.log(usuario);
            console.log(contrasenia);
            console.log("****")
            res.write(`
            <a href="index.html">Volver</a>
            `);
    
        } else {
            // Usuario no encontrado
            res.sendFile(__dirname + '/index.html');
            res.write("<h1 class='bad'>Usuario no existente</h1>");
        }
    } catch (error) {
        console.error('Error en la base de datos: ', error);
        res.sendFile(__dirname + '/index.html');
        res.write("<h1 class='bad'>ERROR EN LA AUTENTIFICACION</h1>");
        
    } finally {
        if (connection) {
            connection.end();
        }
    }
    res.end();
});

async function establecernuevaContra(contrasenia, usuario, connection) {
    const sql = 'UPDATE usuarios SET contrasenia = ? WHERE usuario = ?';

    try {
        const [results] = await connection.execute(sql, [contrasenia, usuario]);
        console.log(`Contraseña actualizada para el usuario ${usuario}`);
    } catch (error) {
        throw error; // Lanza el error para manejarlo en la ruta
    }
}

app.post('/validar-codigo', async (req, res) => {
    const usuario = req.body.usuario;
    const codigoIngresado = req.body.codigo;

    console.log(codigoRecuperacion);
    console.log("\n********* " + codigoRecuperacion);
    console.log("\n********* " + codigoIngresado);
    if (codigoIngresado == codigoRecuperacion) {
        // Redirige a la página cambiarContra.html
       
       
        res.sendFile(__dirname + '/cambiarContra.html');
    } else {
        res.send("<h1 class='bad'>Código de recuperación incorrecto</h1>");
    }

});
//CAMBIAR CONTRASEÑA

