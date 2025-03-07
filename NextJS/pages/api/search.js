import { spawn } from 'child_process';
import path from 'path';

export default function search(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: "Le paramètre 'videoId' est requis" });
  }

  console.log(`Exécution du script Python pour la vidéo ${videoId}...`);
  const scriptPath = path.join(process.cwd(), 'scripts', 'sentiment_analysis_unique.py');

  const python = spawn('python', [scriptPath, videoId]);

  let stdoutData = '';
  let stderrData = '';

  python.stdout.on('data', (data) => { stdoutData += data.toString(); });
  python.stderr.on('data', (data) => { stderrData += data.toString(); });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error("Erreur d'exécution du script:", stderrData);
      return res.status(500).json({ error: stderrData || 'Erreur inconnue' });
    }

    try {
      console.log("Sortie brute du script Python:", stdoutData);
      const data = JSON.parse(stdoutData);

      // Calculer le nombre de commentaires
      const commentCount = data.comments ? data.comments.length : 0;

      // Si les données sont correctes et que les commentaires existent
      if (data && Array.isArray(data.comments)) {
        // Ajouter le commentCount à la réponse envoyée
        return res.status(200).json({ ...data, comment_count: commentCount });
      } else {
        throw new Error('Format des commentaires invalide');
      }
    } catch (err) {
      console.error("Erreur de parsing JSON:", err);
      return res.status(500).json({ error: 'Format JSON invalide', rawData: stdoutData });
    }
  });
}
