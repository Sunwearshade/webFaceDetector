const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 📁 Ruta del archivo de descriptores
const descriptorsPath = path.join(__dirname, '../public/data/descriptors.json');

// 📌 Obtener todos los descriptores registrados
router.get('/get-descriptors', (req, res) => {
    if (!fs.existsSync(descriptorsPath)) return res.json([]);
    
    const descriptors = JSON.parse(fs.readFileSync(descriptorsPath));
    res.json(descriptors);
});

// 📌 Actualizar descriptores manualmente
router.post('/update-descriptors', async (req, res) => {
    try {
        const { exec } = require('child_process');
        exec('node server/generate_descriptors.js', (error, stdout, stderr) => {
            if (error) return res.status(500).json({ message: `❌ Error: ${error.message}` });
            if (stderr) console.error(stderr);
            console.log(stdout);
            res.json({ message: "✅ Descriptores actualizados." });
        });
    } catch (error) {
        res.status(500).json({ message: "❌ Error al actualizar los descriptores." });
    }
});

module.exports = router;
