const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // ejemplo: 'like', 'comentario', 'estadistica', 'noticia', etc.
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // datos flexibles según acción
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
