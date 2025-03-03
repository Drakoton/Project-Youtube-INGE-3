import { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Grid, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from '../components/Sidebar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const [videoId, setVideoId] = useState('');
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState({ positif: 0, neutre: 0, negatif: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setSentimentCounts(data.sentiments || { positif: 0, neutre: 0, negatif: 0 });

    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 16, // Augmente la taille des légendes
            weight: 'bold', // Met en gras
          },
          color: 'black', // Assure que le texte est bien visible
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14, // Augmente la taille des valeurs sur l'axe X
            weight: 'bold', // Met en gras
          },
          color: 'black',
        },
        grid: { color: 'rgba(0, 0, 0, 0.2)' },
      },
      y: {
        ticks: {
          font: {
            size: 14, // Augmente la taille des valeurs sur l'axe Y
            weight: 'bold', // Met en gras
          },
          color: 'black',
        },
        grid: { color: 'rgba(0, 0, 0, 0.2)' },
      },
    },
  };
  

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
    <Box sx={{ display: 'flex', bgcolor: 'white', color: 'black', minHeight: '100vh' }}>
      <Sidebar />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>Rapports des Commentaires</Typography>
        
        <TextField
          label="Video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          sx={{ mb: 2, width: '300px', input: { color: 'black' } }}
          InputLabelProps={{ style: { color: 'black' } }}
        />
        <Button variant="contained" onClick={handleSearch} sx={{ ml: 2 }}>Rechercher</Button>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <>
            <Typography variant="h6">Nombre total de commentaires : {commentCount}</Typography>
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={6}>
                <Bar data={chartData} options={chartOptions}/>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Liste des Commentaires :</Typography>
                <ul>
                  {comments.map((c, i) => (
                    <li key={i}>{c.text} - <strong>{c.sentiment}</strong></li>
                  ))}
                </ul>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Reports;
