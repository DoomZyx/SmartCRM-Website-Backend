# API SmartCRM Backend

API backend pour le site vitrine SmartCRM avec gestion des contacts.

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer les variables d'environnement :**
Copiez le fichier `config.env` et modifiez les valeurs :

```env
PORT=3001
NODE_ENV=development

# Configuration Email (Gmail recommandé)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/smartcrm
```

3. **Configurer Gmail pour l'envoi d'emails :**
   - Activez l'authentification à 2 facteurs
   - Générez un mot de passe d'application
   - Utilisez ce mot de passe dans `EMAIL_PASS`

4. **Démarrer MongoDB :**
```bash
# Installation MongoDB (si pas déjà fait)
# Puis démarrer le service
```

5. **Lancer le serveur :**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📡 Endpoints API

### Contact

#### `POST /api/contact`
Envoie un message de contact.

**Body :**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Entreprise SA",
  "subject": "Demande de démonstration",
  "message": "Bonjour, je souhaite une démonstration..."
}
```

**Réponse succès :**
```json
{
  "success": true,
  "message": "Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Demande de démonstration"
  }
}
```

#### `GET /api/contact`
Récupère tous les contacts (pagination).

**Query params :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `status` : Filtrer par statut (nouveau, en_cours, traité, archivé)

#### `GET /api/contact/:id`
Récupère un contact par ID.

#### `PATCH /api/contact/:id/status`
Met à jour le statut d'un contact.

**Body :**
```json
{
  "status": "en_cours"
}
```

### Autres endpoints

#### `GET /api/health`
Vérifie la santé du serveur.

#### `GET /api/test`
Route de test.

## 📧 Fonctionnalités Email

L'API envoie automatiquement :

1. **Email de confirmation** au client
2. **Email de notification** à l'équipe

## 🗄️ Base de données

### Modèle Contact
```javascript
{
  name: String (requis),
  email: String (requis, validé),
  company: String (optionnel),
  subject: String (requis),
  message: String (requis),
  status: String (enum: nouveau, en_cours, traité, archivé),
  source: String (défaut: formulaire_contact),
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration Frontend

Dans le frontend, utilisez l'URL de l'API :

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 🛡️ Validation

L'API valide automatiquement :
- Format email
- Longueur des champs
- Caractères autorisés
- Champs requis

## 🚨 Gestion d'erreurs

L'API retourne des erreurs structurées :

```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    {
      "field": "email",
      "message": "Veuillez entrer un email valide"
    }
  ]
}
```

## 🔍 Monitoring

- Logs détaillés dans la console
- Suivi des emails envoyés
- Gestion des erreurs MongoDB 