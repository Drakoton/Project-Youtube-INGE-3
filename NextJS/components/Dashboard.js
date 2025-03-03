import { useEffect, useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from './Sidebar';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        const res = await fetch('/api/sentiment');
        if (!res.ok) throw new Error('Erreur de récupération des données');
        const data = await res.json();
        setSentimentData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSentimentData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Erreur: {error}</Typography>;
  if (!sentimentData) return <Typography>Aucune donnée disponible.</Typography>;

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 20, // Augmenter la taille des légendes
            weight: 'bold', // Mettre en gras
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 20, // Augmenter la taille des valeurs sur l'axe X
            weight: 'bold', // Mettre en gras
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 20, // Augmenter la taille des valeurs sur l'axe Y
            weight: 'bold', // Mettre en gras
          },
        },
      },
    },
  };
  

  const chartData = {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Transcriptions',
        data: ['positif', 'neutre', 'négatif'].map((sent) => sentimentData.transcription_sentiments[sent] || 0),
        backgroundColor: ['green', 'yellow', 'red'],
      },
      {
        label: 'Commentaires',
        data: ['positif', 'neutre', 'négatif'].map((sent) => sentimentData.comments_sentiments[sent] || 0),
        backgroundColor: ['brown', 'orange', 'orange'],
      },
    ],
  };

  const correlationData = {
    datasets: [
      {
        label: 'Vues',
        data: sentimentData.video_data.map(video => ({ x: video.comm_sentiment_score, y: video.view_count })),
        backgroundColor: 'blue',
      },
      {
        label: 'Likes',
        data: sentimentData.video_data.map(video => ({ x: video.comm_sentiment_score, y: video.like_count })),
        backgroundColor: 'orange',
      }
    ]
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'white', color: 'black', minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>Analyse des Sentiments</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Bar data={chartData} options={chartOptions} /></Grid>
          <Grid item xs={12} md={6}><Scatter data={correlationData} options={chartOptions} /></Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
