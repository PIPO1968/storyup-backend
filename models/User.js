const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    nick: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tipoUsuario: { type: String, enum: ['Alumno', 'Docente'], required: true },
    tipoCentro: { type: String, enum: ['CEIP', 'IES'], required: true },
    nombreCentro: { type: String, required: true },
    curso: { type: String, enum: ['3º ESO', '4º ESO', '5º ESO', '6º ESO', '7º ESO', '8º ESO', '1º INST', '2º INST'], required: true },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
