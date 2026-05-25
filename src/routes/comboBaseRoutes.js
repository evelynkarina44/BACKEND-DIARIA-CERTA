const express = require('express');

const router = express.Router();

const comboBaseController = require('../controllers/comboBaseController');

router.get('/', comboBaseController.listarComboBases);

router.get('/:id', comboBaseController.buscarComboBasePorId);

router.post('/', comboBaseController.criarComboBase);

router.put('/:id', comboBaseController.atualizarComboBase);

router.delete('/:id', comboBaseController.deletarComboBase);

module.exports = router;
