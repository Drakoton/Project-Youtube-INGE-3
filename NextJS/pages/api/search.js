import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { video_id } = req.query;
  if (!video_id) {
    return res.status(400).json({ error: "L'ID est requis" });
  }

  try {
    console.log("Exécution du script Python pour la recherche de l'ID...");
    const scriptPath = path.join(process.cwd(), 'scripts', 'sentiment_analysis_unique.py');
    const python = spawn('python', [scriptPath, video_id]);

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => { stdoutData += data.toString(); });
    python.stderr.on('data', (data) => { stderrData += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error("Erreur d'exécution du script:", stderrData);
        return res.status(500).json({ error: 'Erreur du script Python', details: stderrData });
      }
      try {
        const data = JSON.parse(stdoutData);
        if (data.error) {
          return res.status(404).json({ error: data.error });
        }
        return res.status(200).json(data);
      } catch (err) {
        console.error("Erreur de parsing JSON:", err);
        return res.status(500).json({ error: 'Format JSON invalide', rawData: stdoutData });
      }
    });
  } catch (error) {
    console.error("Erreur dans le backend:", error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
