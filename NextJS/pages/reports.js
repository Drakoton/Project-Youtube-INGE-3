import { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Grid, Box, Paper } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from '../components/Sidebar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const [videoId, setVideoId] = useState('');
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState({ positif: 0, neutre: 0, negatif: 0 });
  const [engagementRate, setEngagementRate] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);
  const [themes, setThemes] = useState([]);
  const [topKeywords, setTopKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!videoId.trim()) {
      setError("Veuillez entrer un ID de vidéo valide.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?videoId=${videoId}`);
      const data = await response.json();

      console.log("Données de l'API:", data);  // Debugging pour les valeurs de l'API

      if (!response.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      // Mise à jour des états
      setCommentCount(data.comment_count || 0);
      setComments(data.comments || []);
      setSentimentCounts(data.comments_sentiments || { positif: 0, neutre: 0, negatif: 0 });
      setEngagementRate(data.engagement_rate || 0);
      setRetentionRate(data.retention_rate || 0);
      setThemes(data.themes || []);
      setTopKeywords(data.top_keywords || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le graphique
  const sentimentChartData = {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Nombre de commentaires',
        data: [
          sentimentCounts.positif,
          sentimentCounts.neutre,
          sentimentCounts.negatif
        ],
        backgroundColor: ['#4CAF50', '#9E9E9E', '#F44336'],
      },
    ],
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#333' }}>
          Rapports des Commentaires
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TextField
            label="ID de la vidéo"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            sx={{ width: '300px', input: { color: '#333' } }}
            InputLabelProps={{ style: { color: '#666' } }}
          />
          <Button variant="contained" onClick={handleSearch} sx={{ bgcolor: '#1976D2', fontSize: '1rem' }}>
            Rechercher
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Typography color="error" sx={{ fontSize: '1rem' }}>{error}</Typography>}

        {!loading && !error && (
          <>
            <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
              Nombre total de commentaires : {commentCount}
            </Typography>

            {/* Sentiment Global */}
            <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
              Sentiment Global : {sentimentCounts.positif > sentimentCounts.negatif ? 'Positif' : sentimentCounts.negatif > sentimentCounts.positif ? 'Négatif' : 'Neutre'} ({(sentimentCounts.positif - sentimentCounts.negatif).toFixed(2)})
            </Typography>

            {/* Taux d'engagement */}
            <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
              Taux d'Engagement : {(engagementRate * 100).toFixed(2)}%
            </Typography>

            {/* Top 5 des mots-clés */}
            <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
              Top 5 des mots-clés : {topKeywords.slice(0, 5).join(', ')}
            </Typography>

            {/* Thèmes principaux abordés */}
            <Typography variant="h5" sx={{ mb: 2, color: '#333' }}>
              Thèmes principaux abordés : {themes.slice(0, 5).join(', ')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                  <Bar data={sentimentChartData} options={{ responsive: true }} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Liste des Commentaires :</Typography>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {comments.length > 0 ? (
                      comments.map((c, i) => (
                        <Typography key={i} sx={{ fontSize: '1rem', color: '#333', mb: 1 }}>
                          <span dangerouslySetInnerHTML={{ __html: c.text }} />
                          {' - '}
                          <strong style={{ color: c.sentiment === 'positif' ? 'green' : c.sentiment === 'negatif' ? 'red' : 'gray' }}>
                            {c.sentiment}
                          </strong>
                        </Typography>
                      ))
                    ) : (
                      <Typography sx={{ color: '#666' }}>Aucun commentaire trouvé.</Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Reports;
