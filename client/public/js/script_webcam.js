const video = document.getElementById('video');
let faceMatcher;

async function loadRegisteredFaces() {
    const response = await fetch('/get-registered-faces');
    const descriptors = await response.json();
    
    return new faceapi.FaceMatcher(
        descriptors.map(desc => 
            new faceapi.LabeledFaceDescriptors(
                desc.name, 
                [new Float32Array(desc.descriptor)]
            )
        )
    );
}

async function startFaceDetection() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('./public/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('./public/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('./public/models');
    
    faceMatcher = await loadRegisteredFaces();

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => video.srcObject = stream)
        .catch(error => console.error("Error al acceder a la cámara:", error));

    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar detecciones
            faceapi.draw.drawDetections(canvas, resizedDetections);
            
            // Comparar con rostros conocidos
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const text = result.toString();
                const drawBox = new faceapi.draw.DrawBox(box, { label: text });
                drawBox.draw(canvas);
                
                // Si es desconocido, guardar después de 3 segundos de detección
                if (result.label === "unknown") {
                    setTimeout(async () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = canvas.toDataURL('image/png');
                        
                        await fetch('/save-unknown-face', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: imageData })
                        });
                    }, 3000);
                }
            });
        }, 100);
    });
}

startFaceDetection();