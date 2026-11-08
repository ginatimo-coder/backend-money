const express = require('express');
const app = express();

// Render fournit automatiquement un port via process.env.PORT. 
// Si la variable n'existe pas (en local), on utilise le port 4000.
const PORT = process.env.PORT || 4000;

// Middleware pour lire le JSON dans les requêtes
app.use(express.json());

// Route de test pour vérifier que l'API répond
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Serveur backend en ligne et fonctionnel !' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré et à l'écoute sur le port ${PORT}`);
});