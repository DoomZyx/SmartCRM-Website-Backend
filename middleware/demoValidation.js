const { body, validationResult } = require('express-validator');

const validateDemo = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères').matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('email').trim().isEmail().withMessage('Veuillez entrer un email valide').normalizeEmail(),
  body('company').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom de l\'entreprise doit contenir entre 2 et 100 caractères'),
  body('teamSize').isIn(['1-5', '6-10', '11-25', '26-50', '50+']).withMessage('Veuillez sélectionner une taille d\'équipe valide'),
  body('needs').trim().isLength({ min: 10, max: 500 }).withMessage('Les besoins doivent contenir entre 10 et 500 caractères'),
  body('preferredTime').isIn(['Matin (9h-12h)', 'Après-midi (14h-17h)', 'Soirée (18h-20h)', 'Flexible']).withMessage('Veuillez sélectionner un horaire valide'),
  body('duration').isIn(['5 minutes', '10 minutes', '15 minutes']).withMessage('Veuillez sélectionner une durée valide')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      errors: errors.array().map(error => ({ 
        field: error.path, 
        message: error.msg 
      })) 
    });
  }
  next();
};

module.exports = { validateDemo, handleValidationErrors }; 