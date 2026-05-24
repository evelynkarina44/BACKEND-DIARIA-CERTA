const express = require('express');

const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
app.use(express.json());

app.use('/api/usuario', usuarioRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/diarista', diaristaRoutes);

module.exports = app;