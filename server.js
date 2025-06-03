// server.js
const express = require('express');
const multer = require('multer');
const path = require('path'); // Corregido: require('path') es lo correcto
const fs = require('fs');
const cors = require('cors'); // Añadido para manejar CORS

const app = express();
const port = process.env.PORT || 3000; // Easypanel puede establecer PORT, o usa 3000 por defecto

// --- Configuración de CORS ---
// Permite solicitudes desde cualquier origen. Para producción, podrías restringirlo.
app.use(cors());

// --- Configuración de Multer para Almacenamiento de Archivos ---
const UPLOADS_DIR = 'uploads'; // Directorio para guardar los videos

// Asegurarse de que el directorio de subidas exista
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Guardar en la carpeta 'uploads/'
    },
    filename: function (req, file, cb) {
        // Nombre de archivo único: prefijo 'video-' + timestamp + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // Límite de 200MB (ajusta según necesites)
    fileFilter: function (req, file, cb) {
        // Permitir solo archivos mp4 (o los formatos que esperes)
        if (path.extname(file.originalname).toLowerCase() !== '.mp4') {
            return cb(new Error('Solo se permiten archivos MP4.'), false);
        }
        cb(null, true);
    }
});

// --- Middleware para Servir Archivos Estáticos ---
// Esto permite acceder a los videos subidos a través de una URL
// ej. https://videoupload.scanmee.io/uploads/nombre_del_video.mp4
app.use('/uploads', express.static(path.join(__dirname, UPLOADS_DIR)));

// --- Endpoint para la Subida de Videos ---
// Unity enviará los archivos a POST /upload
app.post('/upload', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            message: 'No se subió ningún archivo o el tipo de archivo es inválido.'
        });
    }

    // Construye la URL pública del video.
    const videoFileName = req.file.filename;
    const videoUrl = `https://videoupload.scanmee.io/uploads/${videoFileName}`;

    console.log(`Video subido: ${videoFileName}, URL: ${videoUrl}`);

    res.status(200).json({
        status: 'success',
        message: 'Archivo subido exitosamente!',
        url: videoUrl,
        filename: videoFileName
    });

}, (error, req, res, next) => { // Middleware de manejo de errores para Multer y otros
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ status: 'error', message: `Error de Multer: ${error.message}` });
    } else if (error) {
        console.error("Error en la subida:", error);
        return res.status(500).json({ status: 'error', message: error.message || "Error interno del servidor." });
    }
    next();
});

// --- Ruta Raíz de Prueba ---
app.get('/', (req, res) => {
    res.send('Servidor de subida de videos para ScanMe.io funcionando!');
});

// --- Iniciar el Servidor ---
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
    console.log(`Los archivos se guardarán en: ${path.resolve(UPLOADS_DIR)}`);
    console.log(`Los archivos subidos serán accesibles (ejemplo): https://videoupload.scanmee.io/uploads/nombre_del_archivo.mp4`);
});
