import { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Grid, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const [videoId, setVideoId] = useState('');
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState({ positif: 0, neutre: 0, negatif: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour détecter le sentiment d'un commentaire (exemple simple)
  const analyzeSentiment = (comment) => {
    if (/merci|super|génial|top|excellent|cool/i.test(comment)) return 'positif';
    if (/moyen|ok|bof|neutre/i.test(comment)) return 'neutre';
    if (/nul|horrible|détestable|pire|dommage|triste/i.test(comment)) return 'negatif';
    return 'neutre'; // Par défaut, neutre
  };

  const handleSearch = async () => {
    if (!videoId) {
      alert("Veuillez entrer un Video ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?videoId=${videoId}`, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Données reçues:", data);

      setCommentCount(data.comment_count || 0);
      setComments(data.comments || []);

      // Calculer les sentiments des commentaires
      const sentiments = { positif: 0, neutre: 0, negatif: 0 };
      data.comments.forEach(comment => {
        const sentiment = analyzeSentiment(comment);
        sentiments[sentiment]++;
      });

      setSentimentCounts(sentiments);
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données du graphique
  const chartData = {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Nombre de commentaires',
        data: [sentimentCounts.positif, sentimentCounts.neutre, sentimentCounts.negatif],
        backgroundColor: ['green', 'gray', 'red'],
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Rapports des Commentaires</Typography>

      <TextField
        label="Video ID"
        variant="outlined"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        sx={{ mb: 2, width: '300px' }}
      />
      <Button variant="contained" onClick={handleSearch} sx={{ ml: 2 }}>Rechercher</Button>

      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      {!loading && !error && (
        <>
          <Typography variant="h6" sx={{ mt: 3 }}>Nombre total de commentaires : {commentCount}</Typography>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={6}>
              <Bar data={chartData} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6">Liste des Commentaires :</Typography>
              <ul>
                {comments.map((comment, index) => (
                  <li key={index}>
                    {comment.text} - <strong style={{ color: comment.sentiment === 'positif' ? 'green' : comment.sentiment === 'negatif' ? 'red' : 'gray' }}>
                      {comment.sentiment}
                    </strong>
                  </li>
                ))}
              </ul>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Reports;
