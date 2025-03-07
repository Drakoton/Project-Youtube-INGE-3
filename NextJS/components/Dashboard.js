import { useEffect, useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from '../components/Sidebar';
import { Grid, Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [sentimentData, setSentimentData] = useState(null);
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sentiment data
        const sentimentRes = await fetch('/api/sentiment');
        if (!sentimentRes.ok) throw new Error('Erreur de récupération des données sentimentaires');
        const sentimentJson = await sentimentRes.json();
        setSentimentData(sentimentJson);

        // Fetch theme data
        const themeRes = await fetch('/api/theme');
        if (!themeRes.ok) throw new Error('Erreur de récupération des données des thèmes');
        const themeJson = await themeRes.json();
        setThemeData(themeJson);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error) return <Typography color="error" sx={{ textAlign: 'center', mt: 3 }}>{error}</Typography>;
  if (!sentimentData || !themeData) return <Typography sx={{ textAlign: 'center', mt: 3 }}>Aucune donnée disponible.</Typography>;

  // Calcul du Sentiment moyen des vidéos
  const sentimentScores = sentimentData.video_data.map(video => video.comm_sentiment_score);
  const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
  
  // Calcul du Nombre moyen de tags par vidéo
  const tagsCounts = themeData.video_themes.map(video => video.tags.length);
  const averageTags = tagsCounts.reduce((sum, count) => sum + count, 0) / tagsCounts.length;

  // Fonction pour extraire les mots les plus fréquents dans les titres
  const getMostFrequentWordsInTitles = (titles) => {
    const words = titles.flatMap(title => title.toLowerCase().split(/\s+/));
    const wordCounts = new Map();
    words.forEach(word => {
      if (word && word.length > 2) { // Ignore les mots courts ou vides
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    const sortedWords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
    return sortedWords.slice(0, 5); // Retourne les 5 mots les plus fréquents
  };

  // Extraction des mots-clés les plus fréquents dans les titres
  const titles = themeData.video_themes.map(video => video.title);
  const frequentKeywords = getMostFrequentWordsInTitles(titles);

  // Formatage du sentiment moyen (échelle de -1 à 1)
  const sentimentLabel = averageSentiment > 0 ? 'Positif' : averageSentiment < 0 ? 'Négatif' : 'Neutre';

  // Initialisation des données pour les mots positifs et négatifs
  const positiveWordsData = sentimentData.positive_words ? {
    labels: sentimentData.positive_words.map(word => word[0]),
    datasets: [
      {
        label: 'Mots Positifs',
        data: sentimentData.positive_words.map(word => word[1]),
        backgroundColor: 'green',
      }
    ]
  } : null;

  const negativeWordsData = sentimentData.negative_words ? {
    labels: sentimentData.negative_words.map(word => word[0]),
    datasets: [
      {
        label: 'Mots Négatifs',
        data: sentimentData.negative_words.map(word => word[1]),
        backgroundColor: 'red',
      }
    ]
  } : null;

  const sentimentChartOptions = {
    plugins: {
      legend: {
        labels: {
          font: { size: 16, weight: 'bold' },
          color: '#333',
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 14, weight: 'bold' }, color: '#333' }, grid: { color: 'rgba(0, 0, 0, 0.2)' } },
      y: { ticks: { font: { size: 14, weight: 'bold' }, color: '#333' }, grid: { color: 'rgba(0, 0, 0, 0.2)' } },
    },
  };

  // Graphique des sentiments
  const sentimentChartData = {
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

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#333' }}>
          Analyse des Sentiments
        </Typography>
        <Grid container spacing={3}>
          {/* Graphiques des sentiments et vues/likes */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Bar data={sentimentChartData} options={sentimentChartOptions} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Scatter data={correlationData} options={sentimentChartOptions} />
            </Paper>
          </Grid>

          {/* KPI Sentiment moyen des vidéos */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                Sentiment moyen des vidéos : {sentimentLabel} ({averageSentiment.toFixed(2)})
              </Typography>
            </Paper>
          </Grid>

          {/* KPI Nombre moyen de tags par vidéo */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                Nombre moyen de tags par vidéo : {averageTags.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>

          {/* KPI Mots-clés les plus utilisés dans les titres */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                Mots-clés les plus utilisés dans les titres : {frequentKeywords.map(([word, count]) => `${word} (${count})`).join(', ')}
              </Typography>
            </Paper>
          </Grid>

          {/* Nouveaux graphiques des mots positifs et négatifs */}
          <Grid item xs={12} md={6}>
            {positiveWordsData && (
              <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
                <Bar data={positiveWordsData} options={sentimentChartOptions} />
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {negativeWordsData && (
              <Paper sx={{ p: 2, boxShadow: 1, borderRadius: 2 }}>
                <Bar data={negativeWordsData} options={sentimentChartOptions} />
              </Paper>
            )}
          </Grid>

          {/* Matrice des thèmes */}
          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            Thèmes abordés dans les vidéos
          </Typography>
          <TableContainer 
            component={Paper} 
            sx={{ maxHeight: 400, overflowY: 'auto' }}  // Add scrollable functionality
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Miniature</strong></TableCell>
                  <TableCell><strong>Titre</strong></TableCell>
                  <TableCell><strong>Tags</strong></TableCell>
                  <TableCell><strong>Thèmes</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {themeData.video_themes.map((video, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <iframe
                        width="120"
                        height="90"
                        src={`https://www.youtube.com/embed/${video.video_id}`}
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </TableCell>
                    <TableCell>{video.title || 'Titre indisponible'}</TableCell>
                    <TableCell>{video.tags.join(', ') || 'Aucun'}</TableCell>
                    <TableCell>{video.themes.join(', ') || 'Aucun'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
