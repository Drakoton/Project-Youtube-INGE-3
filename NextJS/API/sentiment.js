import { exec } from 'child_process';

export default function handler(req, res) {
  if (req.method === 'GET') {
    console.log("Exécution du script Python...");
    
    // Exécution du script Python
    exec('python C:/Users/PC/Downloads/Youtube/mon-projet/pages/api/sentiment_analysis.py', (error, stdout, stderr) => {
      // Log des erreurs et de la sortie du script Python
      if (error) {
        console.error("Erreur d'exécution du script:", error);
        return res.status(500).json({ error: stderr || error.message });
      }

      if (stderr) {
        console.error("Erreur dans stderr:", stderr);
        return res.status(500).json({ error: stderr });
      }

      console.log("Sortie du script Python (stdout):", stdout);

      // Tentative de parsing de la sortie du script Python en JSON
      try {
        const data = JSON.parse(stdout); // Parsing de stdout
        console.log("Données JSON reçues:", data);
        return res.status(200).json(data); // Renvoi des données en JSON
      } catch (err) {
        console.error("Erreur de parsing JSON:", err);
        return res.status(500).json({ error: 'Erreur de formatage des données reçues' });
      }
    });
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}