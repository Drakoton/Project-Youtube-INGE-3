import { exec } from 'child_process';

export default function handler(req, res) {
  if (req.method === 'GET') {
    console.log("Exécution du script Python...");

    exec('python C:/Users/PC/Downloads/Youtube/mon-projet/pages/api/sentiment_analysis.py', (error, stdout, stderr) => {
      if (error) {
        console.error("Erreur d'exécution du script:", error);
        return res.status(500).json({ error: stderr || error.message });
      }

      if (stderr) {
        console.error("Erreur dans stderr:", stderr);
        return res.status(500).json({ error: stderr });
      }

      console.log("Sortie du script Python (stdout):", stdout);

      try {
        const data = JSON.parse(stdout); // Parsing de stdout
        console.log("Données JSON reçues:", data);

        // Utilisation des bonnes clés provenant du script Python
        const sentimentCountsDesc = {
          positif: data.description_sentiments['positif'] || 0,
          neutre: data.description_sentiments['neutre'] || 0,
          négatif: data.description_sentiments['négatif'] || 0,
        };

        const sentimentCountsComm = {
          positif: data.comments_sentiments['positif'] || 0,
          neutre: data.comments_sentiments['neutre'] || 0,
          négatif: data.comments_sentiments['négatif'] || 0,
        };

        // Renvoi des données formatées pour le frontend
        return res.status(200).json({
          description_sentiments: sentimentCountsDesc,
          comments_sentiments: sentimentCountsComm
        });
      } catch (err) {
        console.error("Erreur de parsing JSON:", err);
        return res.status(500).json({ error: 'Erreur de formatage des données reçues' });
      }
    });
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
