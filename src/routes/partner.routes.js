const express = require('express');
const router = express.Router();
const Partner = require('../models/partner');

// Crear socio
router.post('/', async (req, res) => {
  try {
    const partner = new Partner(req.body);
    await partner.save();
    res.status(201).json(partner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Obtener socios
router.get('/', async (req, res) => {
  const partners = await Partner.find({ active: true });
  res.json(partners);
});

// Editar socio
router.put('/:id', async (req, res) => {
  const partner = await Partner.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(partner);
});

// Eliminar (desactivar)
router.delete('/:id', async (req, res) => {
  await Partner.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ message: 'Socio desactivado' });
});

module.exports = router;
