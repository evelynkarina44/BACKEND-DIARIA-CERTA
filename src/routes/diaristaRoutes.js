const express = require('express');

const router = express.Router();

const diaristaController = require('../controllers/diaristaController');

router.get('/', diaristaController.listarDiaristas);

router.get('/:id', diaristaController.buscarDiaristaPorId);

router.post('/', diaristaController.criarDiarista);

router.put('/:id', diaristaController.atualizarDiarista);

router.delete('/:id', diaristaController.deletarDiarista);

module.exports = router;