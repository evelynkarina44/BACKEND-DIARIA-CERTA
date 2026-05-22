const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

//endpoint de teste do servidor
app.get('/api', (req, res) => {
    res.json({ message: 'API conectada com sucesso' });
});

//endpoint busca usuários
app.get('/api/usuarios', async (req, res) => {
    const usuarios = await prisma.usuario.findMany();
    res.json(usuarios);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});