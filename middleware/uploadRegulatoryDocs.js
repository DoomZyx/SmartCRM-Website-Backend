const multer = require("multer");

const MAX_SIZE_MB = 5;
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Type de fichier non autorisé (PDF ou image uniquement)."));
  },
}).fields([
  { name: "kbisDocument", maxCount: 1 },
  { name: "idDocumentRecto", maxCount: 1 },
  { name: "idDocumentVerso", maxCount: 1 },
  { name: "addressDocument", maxCount: 1 },
]);

module.exports = { uploadRegulatoryDocs: upload };
