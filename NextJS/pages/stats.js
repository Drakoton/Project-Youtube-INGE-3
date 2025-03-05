// pages/stats.js
import Sidebar from '../components/Sidebar';
import { Box, Typography, TextField, Button, CircularProgress, Grid } from '@mui/material';
import React, { useState } from 'react';

const Stats = () => {
  const [videoId, setVideoId] = useState('');
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recommendations?videoId=${videoId}`);
      const data = await response.json();

      if (response.ok) {
        setRecommendedVideos(data.recommendations);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erreur de récupération des recommandations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#333' }}>
          Recommandations de Vidéos
        </Typography>

        <TextField
          label="ID de la vidéo"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          sx={{
            mb: 2,
            width: '300px',
            input: { color: '#333', fontSize: '1rem' },
          }}
          InputLabelProps={{ style: { color: '#666' } }}
        />
        <Button variant="contained" onClick={handleSearchRecommendations} sx={{ ml: 5, bgcolor: '#1976D2', fontSize: '1rem' }}>
          Rechercher
        </Button>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Typography color="error" sx={{ fontSize: '1rem' }}>{error}</Typography>}

        {!loading && !error && recommendedVideos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            {recommendedVideos.map((video) => (
              <Grid container spacing={1} key={video.video_id} sx={{ mb: 3, bgcolor: '#FFF', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Grid item xs={8}>
                  <Typography variant="h5" sx={{ fontSize: '1.2rem', color: '#333' }}>{video.title}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1rem', color: '#666' }}>{video.channel_name}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1rem', color: '#666' }}>{`Durée: ${video.duration}`}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1rem', color: '#666' }}>{`Vues: ${video.view_count}`}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1rem', color: '#666' }}>{`Likes: ${video.like_count}`}</Typography>
                </Grid>

                <Grid item xs={4}>
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${video.video_id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </Grid>
              </Grid>
            ))}
          </Box>
        )}

        {recommendedVideos.length === 0 && !loading && !error && (
          <Typography variant="body1" sx={{ fontSize: '1rem', color: '#666' }}>Aucune recommandation trouvée</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Stats;
