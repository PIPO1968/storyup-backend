const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Importar modelo de usuario
const User = require('./models/User');

// Modelo de eventos/acciones
const Event = require('./models/Event');


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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        // Comparar password con hash
        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        // Generar token JWT (2 horas)
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
        // Endpoint para refrescar el token si el usuario está activo
        app.post('/refresh-token', auth, async (req, res) => {
            try {
                // Generar nuevo token (2 horas)
                const token = jwt.sign({ userId: req.userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
                res.json({ token });
            } catch (err) {
                res.status(500).json({ error: 'Error al refrescar token', detalle: err.message });
            }
        });
        // Devolver datos y token
        const { _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email: userEmail } = user;
        res.json({
            token,
            user: { _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email: userEmail }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión', detalle: err.message });
    }
});
// Middleware para autenticar JWT
async function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.userId = decoded.userId;
        // Actualizar lastActive en cada petición autenticada
        await User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() });
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Endpoint para obtener datos del usuario autenticado
app.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        const { _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email } = user;
        res.json({ _id, nombre, apellido, nick, tipoUsuario, tipoCentro, nombreCentro, curso, email });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario', detalle: err.message });
    }
});

// Endpoint para actualizar datos básicos del usuario autenticado
app.put('/me', auth, async (req, res) => {
    try {
        const { nombre, nick, curso } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (nombre !== undefined) user.nombre = nombre;
        if (nick !== undefined) user.nick = nick;
        if (curso !== undefined) user.curso = curso;
        await user.save();
        res.json({ mensaje: 'Perfil actualizado', user });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar perfil', detalle: err.message });
    }
});


// Endpoint generalizado para guardar cualquier acción/evento
app.post('/event', auth, async (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type || !data) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: type y data' });
        }
        const event = new Event({ userId: req.userId, type, data });
        await event.save();
        res.status(201).json({ mensaje: 'Evento guardado', event });
    } catch (err) {
        res.status(500).json({ error: 'Error al guardar evento', detalle: err.message });
    }
});

// Endpoint para estadísticas de usuarios inscritos y online
app.get('/stats/users', async (req, res) => {
    try {
        const total = await User.countDocuments();
        // Usuarios online: lastActive en los últimos 2 minutos
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const online = await User.countDocuments({ lastActive: { $gte: twoMinutesAgo } });
        res.json({ total, online });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener estadísticas', detalle: err.message });
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
        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // Guardar usuario
        const nuevoUsuario = new User({ nombre, apellido, nick, email, password: passwordHash, tipoUsuario, tipoCentro, nombreCentro, curso });
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
