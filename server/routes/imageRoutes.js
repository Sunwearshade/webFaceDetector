const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 📁 Directorios
const usersDir = path.join(__dirname, '../public/images/usuarios');
const unknownDir = path.join(__dirname, '../public/images/unknown');

// 📌 Guardar imágenes de usuarios
router.post('/save-user', (req, res) => {
    const { name, image } = req.body;
    if (!name || !image) return res.status(400).json({ message: "❌ Datos incompletos." });

    if (!fs.existsSync(usersDir)) fs.mkdirSync(usersDir, { recursive: true });

    const filePath = path.join(usersDir, `${name}.png`);
    fs.writeFileSync(filePath, image.replace(/^data:image\/png;base64,/, ""), 'base64');
    console.log(`✅ Usuario ${name} guardado en ${filePath}`);

    res.json({ message: "✅ Imagen guardada correctamente." });
});

// 📌 Guardar rostros desconocidos
router.post('/save-unknown', (req, res) => {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "❌ Imagen no recibida." });

    if (!fs.existsSync(unknownDir)) fs.mkdirSync(unknownDir, { recursive: true });

    const filePath = path.join(unknownDir, `unknown_${Date.now()}.png`);
    fs.writeFileSync(filePath, image.replace(/^data:image\/png;base64,/, ""), 'base64');
    console.log(`✅ Rostro desconocido guardado en ${filePath}`);

    res.json({ message: "✅ Rostro desconocido registrado." });
});

// 📌 Obtener imágenes de usuarios registrados
router.get('/get-user-images', (req, res) => {
    fs.readdir(usersDir, (err, files) => {
        if (err) return res.status(500).json({ message: "❌ Error al leer las imágenes." });
        res.json(files);
    });
});


module.exports = router;
