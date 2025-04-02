const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const nameInput = document.getElementById('name');

async function startVideo() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('./public/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('./public/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('./public/models');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error:", error);
    }
}

captureButton.addEventListener('click', async () => {
    if (!nameInput.value.trim()) {
        alert("Por favor, ingresa un nombre.");
        return;
    }

    // Detectar rostro
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
    
    if (detections.length === 0) {
        alert("No se detectó ningún rostro.");
        return;
    }

    // Capturar imagen
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    // Enviar al servidor
    try {
        const response = await fetch('/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: nameInput.value.trim(), 
                image: imageData 
            })
        });
        
        const result = await response.json();
        alert(result.message);
        nameInput.value = "";
    } catch (error) {
        console.error("Error al registrar:", error);
        alert("Error al registrar el rostro");
    }
});

startVideo();