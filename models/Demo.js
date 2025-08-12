const mongoose = require('mongoose');

const demoSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Le nom est requis'], 
    trim: true, 
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'] 
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est requis'], 
    trim: true, 
    lowercase: true, 
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide'] 
  },
  company: { 
    type: String, 
    required: [true, 'Le nom de l\'entreprise est requis'], 
    trim: true, 
    maxlength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères'] 
  },
  teamSize: { 
    type: String, 
    required: [true, 'La taille de l\'équipe est requise'], 
    enum: ['1-5', '6-10', '11-25', '26-50', '50+'] 
  },
  needs: { 
    type: String, 
    required: [true, 'Les besoins sont requis'], 
    trim: true, 
    maxlength: [500, 'Les besoins ne peuvent pas dépasser 500 caractères'] 
  },
  preferredTime: { 
    type: String, 
    required: [true, 'L\'horaire préféré est requis'], 
    enum: ['Matin (9h-12h)', 'Après-midi (14h-17h)', 'Soirée (18h-20h)', 'Flexible'] 
  },
  duration: { 
    type: String, 
    required: [true, 'La durée souhaitée est requise'], 
    enum: ['5 minutes', '10 minutes', '15 minutes'] 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Demo', demoSchema); 