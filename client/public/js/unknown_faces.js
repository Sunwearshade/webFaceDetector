document.addEventListener('DOMContentLoaded', async () => {
    const unknownList = document.getElementById('unknown-list');
    
    try {
        const response = await fetch('/get-unknown-faces');
        const files = await response.json();
        
        files.forEach(file => {
            const img = document.createElement('img');
            img.src = `/public/images/unknown/${file}`;
            img.alt = "Rostro desconocido";
            unknownList.appendChild(img);
        });
    } catch (error) {
        console.error("Error al cargar rostros desconocidos:", error);
    }
});