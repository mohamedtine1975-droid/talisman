const mongoose = require('mongoose');

// Compteur auto-incrémenté pour le numéro de ticket
const compteurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  valeur: { type: Number, default: 0 }
});
const Compteur = mongoose.model('Compteur', compteurSchema);

const ticketSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
    // Ex: T-001, T-002... généré automatiquement
  },
  // Peut être client inscrit OU anonyme
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Infos pour les clients non-inscrits
  nomClient: {
    type: String,
    required: [true, 'Le nom du client est obligatoire'],
    trim: true
  },
  telephoneClient: {
    type: String,
    required: [true, 'Le téléphone est obligatoire'],
    trim: true
  },
  // Prestation
  service: {
    type: String,
    required: [true, 'Le service est obligatoire'],
    enum: [
      'coupe_simple',
      'coupe_barbe',
      'degrade_simple',
      'degrade_noir',
      'degrade_enfant',
      'degrade_enfant_noir',
      'taper',
      'teinture_partielle',
      'teinture_complete',
      'teinture_coiffure',
      'lavage'
    ]
  },
  prixCFA: {
    type: Number,
    required: true
  },
  // Créneau souhaité
  creneau: {
    type: String,
    enum: ['matin', 'apres_midi', 'soir'],
    default: 'matin'
  },
  // File d'attente
  position: {
    type: Number,
    default: null // Position dans la file
  },
  statut: {
    type: String,
    enum: ['en_attente', 'en_cours', 'termine', 'annule', 'absent'],
    default: 'en_attente'
  },
  // Coiffeur assigné
  coiffeurAssigne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Timestamps métier
  heureAppel: { type: Date, default: null },     // Quand appelé en salle
  heureDebut: { type: Date, default: null },      // Début de la coupe
  heureFin: { type: Date, default: null },        // Fin de la coupe
  // Durée estimée en minutes selon le service
  dureeEstimeeMin: { type: Number, default: 20 },
  // Notes
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// ─── Index pour les requêtes fréquentes ─────────────────
ticketSchema.index({ statut: 1, createdAt: 1 });
ticketSchema.index({ numero: 1 });

// ─── Génération automatique du numéro de ticket ─────────
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const compteur = await Compteur.findOneAndUpdate(
      { nom: 'ticket' },
      { $inc: { valeur: 1 } },
      { new: true, upsert: true }
    );
    const num = String(compteur.valeur).padStart(3, '0');
    this.numero = `T-${num}`;
  }
  next();
});

// ─── Prix par service ────────────────────────────────────
ticketSchema.statics.PRIX = {
  coupe_simple: 2500,
  coupe_barbe: 3000,
  degrade_simple: 3000,
  degrade_noir: 5000,
  degrade_enfant: 2500,
  degrade_enfant_noir: 3500,
  taper: 5000,
  teinture_partielle: 6000,
  teinture_complete: 10000,
  teinture_coiffure: 13000,
  lavage: 1500
};

ticketSchema.statics.DUREE = {
  coupe_simple: 15,
  coupe_barbe: 30,
  degrade_simple: 25,
  degrade_noir: 35,
  degrade_enfant: 20,
  degrade_enfant_noir: 30,
  taper: 30,
  teinture_partielle: 40,
  teinture_complete: 60,
  teinture_coiffure: 75,
  lavage: 10
};

ticketSchema.statics.LABELS = {
  coupe_simple: 'Coupe Simple',
  coupe_barbe: 'Coupe + Barbe',
  degrade_simple: 'Dégradé Simple',
  degrade_noir: 'Dégradé + Noir',
  degrade_enfant: 'Dégradé Enfant',
  degrade_enfant_noir: 'Dégradé Enfant + Noir',
  taper: 'Taper',
  teinture_partielle: 'Teinture Partielle',
  teinture_complete: 'Teinture Complète',
  teinture_coiffure: 'Teinture + Coiffure',
  lavage: 'Lavage'
};

module.exports = mongoose.model('Ticket', ticketSchema);
