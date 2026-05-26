const express = require('express');

const router = express.Router();

const enderecoController = require('../controllers/enderecoController');

router.get('/', enderecoController.listarEnderecos);

router.get('/:id', enderecoController.buscarEnderecoPorId);

router.post('/', enderecoController.criarEndereco);

router.put('/:id', enderecoController.atualizarEndereco);

router.delete('/:id', enderecoController.deletarEndereco);

module.exports = router;