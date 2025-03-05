import { useEffect, useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from '../components/Sidebar';
import { Grid, Box, Typography, CircularProgress, Paper } from '@mui/material';

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

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error) return <Typography color="error" sx={{ textAlign: 'center', mt: 3 }}>{error}</Typography>;
  if (!sentimentData) return <Typography sx={{ textAlign: 'center', mt: 3 }}>Aucune donnée disponible.</Typography>;

  console.log(sentimentData); // Add this line to debug and check the structure of the data

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          font: {
            size: 16,
            weight: 'bold',
          },
          color: '#333',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#333',
        },
        grid: { color: 'rgba(0, 0, 0, 0.2)' },
      },
      y: {
        ticks: {
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#333',
        },
        grid: { color: 'rgba(0, 0, 0, 0.2)' },
      },
    },
  };

  // Graphique des sentiments
  const chartData = {
    labels: ['Positif', 'Neutre', 'Négatif'],
    datasets: [
      {
        label: 'Transcriptions',
        data: [
          sentimentData.transcription_sentiments.positif || 0,
          sentimentData.transcription_sentiments.neutre || 0,
          sentimentData.transcription_sentiments.negatif || 0,
        ],
        backgroundColor: ['green', 'gray', 'red'],
      },
      {
        label: 'Commentaires',
        data: [
          sentimentData.comments_sentiments.positif || 0,
          sentimentData.comments_sentiments.neutre || 0,
          sentimentData.comments_sentiments.negatif || 0,
        ],
        backgroundColor: ['blue', 'orange', 'purple'],
      },
    ],
  };

  // Graphique des vues et likes
  const correlationData = {
    datasets: [
      {
        label: 'Vues',
        data: (sentimentData.video_data || []).map(video => ({ x: video.comm_sentiment_score, y: video.view_count })),
        backgroundColor: 'blue',
      },
      {
        label: 'Likes',
        data: (sentimentData.video_data || []).map(video => ({ x: video.comm_sentiment_score, y: video.like_count })),
        backgroundColor: 'orange',
      }
    ]
  };

  // Données des mots fréquents positifs et négatifs
  const positiveWordsData = {
    labels: sentimentData.positive_words.map(word => word[0]),
    datasets: [
      {
        label: 'Mots Positifs',
        data: sentimentData.positive_words.map(word => word[1]),
        backgroundColor: 'green',
      }
    ]
  };

  const negativeWordsData = {
    labels: sentimentData.negative_words.map(word => word[0]),
    datasets: [
      {
        label: 'Mots Négatifs',
        data: sentimentData.negative_words.map(word => word[1]),
        backgroundColor: 'red',
      }
    ]
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#333' }}>
          Analyse des Sentiments
        </Typography>
        <Grid container spacing={3}>
          {/* Graphiques existants */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Bar data={chartData} options={chartOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Scatter data={correlationData} options={chartOptions} />
            </Paper>
          </Grid>

          {/* Nouveaux graphiques des mots positifs et négatifs */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Bar data={positiveWordsData} options={chartOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Bar data={negativeWordsData} options={chartOptions} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
