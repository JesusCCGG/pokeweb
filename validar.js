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

app.post('/a', async (req, res) => {

    const usuario = req.body.usuario;
    const contrasenia = req.body.contrasenia;
  

    try {
        connection = await getConnection();  // Obtener la conexión

        const query = 'SELECT id_cargo FROM usuarios WHERE usuario = ? AND contrasenia = ?';
        const [results] = await connection.execute(query, [usuario, contrasenia]);

        if (results.length > 0) {
            const id_cargo = results[0].id_cargo;
          //  const token = generarToken(usuario, id_cargo);

            // if (id_cargo == 1) {
            //     // Administrador
            //     res.write(`
            //     <script>
            //         sessionStorage.setItem('token', "${token}");
            //         sessionStorage.setItem('id_cargo', ${id_cargo});
            //     </script>
            // `);
            // res.sendFile(__dirname + '/Vista_administrador.html');
            // } else if (id_cargo == 2) {
            //     // Cliente
                
            //     res.write(`
            //     <script>
            //         sessionStorage.setItem('token', "${token}");
            //         sessionStorage.setItem('id_cargo', ${id_cargo});
            //     </script>`);
            // } else {
            //     // Otro cargo no identificado
            //     res.sendFile(__dirname + '/index.html');
            //     res.write("<h1 class='bad'>Acceso no autorizado</h1>");
            // }
            try {
                const token = generarToken(usuario, id_cargo);
                // Almacena el token en localStorage y redirige según el ID de cargo
                res.write(`
                    <script>
                        sessionStorage.setItem('token', "${token}");
                        sessionStorage.setItem('id_cargo', ${id_cargo});
                        window.location.href = (sessionStorage.getItem('id_cargo') == 1) ? '/Vista_administrador.html' : '/Vista_cliente.html';
                    </script>
                `);
            } catch (error) {
                console.error('Error al generar el token:', error);
                return res.status(500).send("<h1 class='bad'>ERROR EN LA AUTENTIFICACION</h1>");
            }        
            
        } 
        else {
            // Usuario o contraseña incorrectos
            res.sendFile(__dirname + '/index.html');
            res.write("<h1 class='bad'>Usuario o contraseña incorrectos</h1>");
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
    console.log('Token JWT:', token);
    return token;
}

            
const nodemailer = require('nodemailer'); //mandamos a llamar la libreria
// Dependencias y configuraciones previas...
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
            res.write("<h1 class='bad'>Codigo de recuperacion enviado</h1>" + usuario);

            // Suponiendo que enviarMail es una función definida en otro lugar
            enviarMail(usuario);
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
