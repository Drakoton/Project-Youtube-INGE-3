import { spawn } from 'child_process';

export default function handler(req, res) {
  if (req.method === 'GET') {
    console.log("Exécution du script Python...");

    const scriptPath = `${process.cwd()}/pages/api/sentiment_analysis.py`;
    const python = spawn('python', [scriptPath]);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    python.on('close', (code) => {
      console.log("Sortie complète du script Python:", stdoutData); // 🔍 Debug

      if (code !== 0) {
        console.error("Erreur d'exécution du script:", stderrData);
        return res.status(500).json({ error: stderrData || 'Erreur inconnue' });
      }

      try {
        const data = JSON.parse(stdoutData);

        // Vérifier que les sentiments des descriptions et commentaires sont présents
        if (
          (!data.description_sentiments || Object.keys(data.description_sentiments).length === 0) ||
          (!data.comments_sentiments || Object.keys(data.comments_sentiments).length === 0)
        ) {
          return res.status(404).json({ error: 'Pas de données disponibles pour les sentiments des descriptions ou des commentaires.' });
        }

        return res.status(200).json(data);
      } catch (err) {
        console.error("Erreur de parsing JSON:", err);
        return res.status(500).json({ error: 'Format JSON invalide', rawData: stdoutData });
      }
    });

    python.on('error', (err) => {
      console.error("Erreur lors du lancement du script Python:", err);
      return res.status(500).json({ error: 'Erreur lors de l’exécution du script Python' });
    });

  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
}
