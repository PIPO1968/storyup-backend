require('dotenv').config();
const express = require('express');







const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Importar modelo de usuario
const User = require('./models/User');


// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));

// Ruta para login de usuario
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan email o contraseña' });
        }
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        // Devolver solo datos básicos, no password
        const { _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email: userEmail } = user;
        res.json({ _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email: userEmail });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión', detalle: err.message });
    }
});


// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error de conexión a MongoDB:', err));



// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de StoryUp funcionando correctamente' });
});

// Ruta para registrar usuario
app.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, nick, email, password, tipoUsuario, tipoCentro, nombreCentro, curso } = req.body;
        // Validación básica
        if (!nombre || !apellido || !nick || !email || !password || !tipoUsuario || !tipoCentro || !nombreCentro || !curso) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        // Comprobar si el email o nick ya existen
        const existeEmail = await User.findOne({ email });
        const existeNick = await User.findOne({ nick });
        if (existeEmail) return res.status(409).json({ error: 'El email ya está registrado' });
        if (existeNick) return res.status(409).json({ error: 'El nick ya está registrado' });
        // Guardar usuario
        const nuevoUsuario = new User({ nombre, apellido, nick, email, password, tipoUsuario, tipoCentro, nombreCentro, curso });
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar usuario', detalle: err.message });
    }
});

// Puerto para Render (usa variable de entorno PORT)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});

// Cambio menor para forzar redeploy en Render
