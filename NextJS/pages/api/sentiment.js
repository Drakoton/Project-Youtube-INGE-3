import { spawn } from 'child_process';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  console.log("Exécution du script Python...");
  const scriptPath = path.join(process.cwd(), 'scripts', 'sentiment_analysis.py');
  const python = spawn('python', [scriptPath]);

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
      const data = JSON.parse(stdoutData);
      if (!data.video_data) {
        return res.status(500).json({ error: 'video_data is missing in the response' });
      }
      return res.status(200).json(data);
    } catch (err) {
      console.error("Erreur de parsing JSON:", err);
      return res.status(500).json({ error: 'Format JSON invalide', rawData: stdoutData });
    }
  });
}
