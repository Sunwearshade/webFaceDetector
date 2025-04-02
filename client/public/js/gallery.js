document.addEventListener('DOMContentLoaded', async () => {
    const galleryDiv = document.getElementById('gallery');
    
    try {
        const response = await fetch('/get-registered-faces');
        const faces = await response.json();
        
        faces.forEach(face => {
            const img = document.createElement('img');
            img.src = `/public/images/usuarios/${face.name}.png`;
            img.alt = face.name;
            galleryDiv.appendChild(img);
        });
    } catch (error) {
        console.error("Error al cargar rostros:", error);
    }
});