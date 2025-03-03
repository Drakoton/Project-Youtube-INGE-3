// pages/api/recommendations.js

import { spawn } from 'child_process';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: "Le paramètre 'videoId' est requis" });
  }

  console.log(`Exécution du script Python pour la recommandation de la vidéo ${videoId}...`);
  const scriptPath = path.join(process.cwd(), 'scripts', 'video_recommendation.py'); // Assurez-vous que le chemin est correct

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

      if (data && Array.isArray(data.recommendations)) {
        return res.status(200).json(data);
      } else {
        throw new Error('Format des recommandations invalide');
      }
    } catch (err) {
      console.error("Erreur de parsing JSON:", err);
      return res.status(500).json({ error: 'Format JSON invalide', rawData: stdoutData });
    }
  });
}
