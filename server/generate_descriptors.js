const fs = require('fs');
const path = require('path');
const faceapi = require('face-api.js');
const { Canvas, Image } = require('canvas');
const canvas = require('canvas');

// 📁 Directorios
const usersDir = path.join(__dirname, '../public/images/usuarios');
const descriptorsPath = path.join(__dirname, '../public/data/descriptors.json');

(async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');

    let descriptors = [];

    // 🔍 Leer imágenes de usuarios
    const files = fs.readdirSync(usersDir);
    for (const file of files) {
        const filePath = path.join(usersDir, file);
        const img = await canvas.loadImage(filePath);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            descriptors.push({
                name: path.parse(file).name,
                descriptor: Array.from(detection.descriptor)
            });
            console.log(`✅ Descriptor generado para ${file}`);
        } else {
            console.log(`⚠️ No se detectó rostro en ${file}`);
        }
    }

    // 📝 Guardar descriptores en JSON
    fs.writeFileSync(descriptorsPath, JSON.stringify(descriptors, null, 2));
    console.log(`✅ Descriptores guardados en ${descriptorsPath}`);
})();
