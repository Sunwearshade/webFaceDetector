const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const faceapi = require('face-api.js');
const { Canvas, Image } = require('canvas');
const canvas = require('canvas');

const app = express();
const PORT = 3000;

// Configuración de middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client'))); // Servir archivos estáticos desde client
app.use('/public', express.static(path.join(__dirname, '../client/public'))); // Ruta para los assets públicos

// Rutas para las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/register.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/gallery.html'));
});

app.get('/unknown-faces', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/unknown_faces.html'));
});

// API Routes
app.post('/save-image', async (req, res) => {
    console.log("📩 Recibiendo solicitud para guardar imagen...");
    const { name, image } = req.body;

    if (!name || !image) {
        console.error("❌ Error: Faltan datos (nombre o imagen).");
        return res.status(400).json({ message: "❌ Faltan datos." });
    }

    const userDir = path.join(__dirname, '../client/public/images/usuarios');
    if (!fs.existsSync(userDir)) {
        console.log(`📁 Creando carpeta: ${userDir}`);
        fs.mkdirSync(userDir, { recursive: true });
    }

    const filePath = path.join(userDir, `${name}.png`);
    const base64Data = image.replace(/^data:image\/png;base64,/, "");

    console.log(`📝 Guardando imagen en: ${filePath}`);
    fs.writeFile(filePath, base64Data, 'base64', async (err) => {
        if (err) {
            console.error("❌ Error al guardar imagen:", err);
            return res.status(500).json({ message: "Error al guardar la imagen." });
        }
        console.log(`✅ Imagen guardada correctamente en ${filePath}`);

        console.log("🔍 Procesando detección facial...");
        try {
            // Cargar la imagen de manera compatible con face-api.js
            const img = new Image();
            img.src = filePath;

            // Esperar a que la imagen se cargue
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Crear un canvas temporal
            const tempCanvas = canvas.createCanvas(img.width, img.height);
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Realizar la detección facial
            const detection = await faceapi.detectSingleFace(tempCanvas)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                console.log("✅ Rostro detectado correctamente.");
                const descriptor = {
                    name: name,
                    descriptor: Array.from(detection.descriptor)
                };

                const descriptorsPath = path.join(__dirname, '../client/public/data/descriptors.json');
                let descriptors = [];
                if (fs.existsSync(descriptorsPath)) {
                    console.log("📖 Leyendo archivo descriptors.json...");
                    descriptors = JSON.parse(fs.readFileSync(descriptorsPath));
                }
                descriptors.push(descriptor);

                console.log("💾 Guardando descriptor en descriptors.json...");
                fs.writeFileSync(descriptorsPath, JSON.stringify(descriptors, null, 2));
                console.log(`✅ Descriptor de ${name} guardado en ${descriptorsPath}`);
            } else {
                console.warn(`⚠️ No se detectó un rostro en ${filePath}`);
            }

            res.json({ message: "✅ Usuario registrado correctamente." });
        } catch (error) {
            console.error("❌ Error en detección facial:", error);
            res.status(500).json({ message: "Error en detección facial" });
        }
    });
});

app.get('/get-registered-faces', (req, res) => {
    console.log("📩 Solicitando lista de rostros registrados...");
    const descriptorsPath = path.join(__dirname, '../client/public/data/descriptors.json');
    if (fs.existsSync(descriptorsPath)) {
        console.log("✅ Archivo descriptors.json encontrado.");
        const descriptors = JSON.parse(fs.readFileSync(descriptorsPath));
        res.json(descriptors);
    } else {
        console.warn("⚠️ No se encontró descriptors.json, devolviendo lista vacía.");
        res.json([]);
    }
});

app.get('/get-unknown-faces', (req, res) => {
    const unknownDir = path.join(__dirname, '../client/public/images/unknown');
    
    if (!fs.existsSync(unknownDir)) {
        return res.json([]);
    }
    
    const files = fs.readdirSync(unknownDir);
    res.json(files);
});

app.post('/save-unknown-face', (req, res) => {
    console.log("📩 Recibiendo solicitud para guardar rostro desconocido...");
    const { image } = req.body;

    if (!image) {
        console.error("❌ Error: Imagen no recibida.");
        return res.status(400).json({ message: "❌ Imagen no recibida." });
    }

    const unknownDir = path.join(__dirname, '../client/public/images/unknown');
    if (!fs.existsSync(unknownDir)) {
        console.log(`📁 Creando carpeta: ${unknownDir}`);
        fs.mkdirSync(unknownDir, { recursive: true });
    }

    const filePath = path.join(unknownDir, `unknown_${Date.now()}.png`);
    const base64Data = image.replace(/^data:image\/png;base64,/, "");

    console.log(`📝 Guardando imagen en: ${filePath}`);
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error("❌ Error al guardar imagen desconocida:", err);
            return res.status(500).json({ message: "Error al guardar la imagen." });
        }
        console.log(`✅ Rostro desconocido guardado en ${filePath}`);
        res.json({ message: "✅ Rostro desconocido registrado." });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📌 Rutas disponibles:`);
    console.log(`- http://localhost:${PORT}/ (Página principal)`);
    console.log(`- http://localhost:${PORT}/register (Registro de rostros)`);
    console.log(`- http://localhost:${PORT}/gallery (Galería de rostros)`);
    console.log(`- http://localhost:${PORT}/unknown-faces (Rostros desconocidos)`);
});
