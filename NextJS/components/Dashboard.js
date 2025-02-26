// components/Dashboard.js
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

  const chartData = {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Descriptions',
        data: ['positif', 'neutre', 'négatif'].map((sent) => sentimentData.description_sentiments[sent] || 0),
        backgroundColor: ['green', 'gray', 'red'],
      },
      {
        label: 'Commentaires',
        data: ['positif', 'neutre', 'négatif'].map((sent) => sentimentData.comments_sentiments[sent] || 0),
        backgroundColor: ['blue', 'purple', 'orange'],
      },
    ],
  };

  const correlationData = {
    datasets: [
      {
        label: 'Sentiment vs Vues',
        data: sentimentData.video_data.map(video => ({ x: video.comm_sentiment_score, y: video.view_count })),
        backgroundColor: 'blue',
      },
      {
        label: 'Sentiment vs Likes',
        data: sentimentData.video_data.map(video => ({ x: video.comm_sentiment_score, y: video.like_count })),
        backgroundColor: 'orange',
      }
    ]
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>Analyse des Sentiments</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Bar data={chartData} /></Grid>
          <Grid item xs={12} md={6}><Scatter data={correlationData} /></Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
