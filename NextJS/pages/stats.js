import Sidebar from '../components/Sidebar'; // Assure-toi que le chemin est correct
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
      console.error('Erreur lors de la récupération des recommandations:', error);
      setError('Erreur de récupération des recommandations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar sx={{ width: 300 }} />  {/* Agrandir la largeur de la sidebar ici */}
      <Box sx={{ flexGrow: 1, padding: 3 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2.5rem' }}>
          Recommandations de Vidéos
        </Typography>

        <TextField
          label="Video ID"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          sx={{ mb: 2, width: '300px', input: { color: 'black', fontSize: '1.1rem' } }}
          InputLabelProps={{ style: { color: 'black', fontSize: '1.1rem' } }}
        />
        <Button variant="contained" onClick={handleSearchRecommendations} sx={{ ml: 2, fontSize: '1.2rem' }}>
          Rechercher
        </Button>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Typography color="error" sx={{ fontSize: '1.1rem' }}>{error}</Typography>}

        {!loading && !error && recommendedVideos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            {recommendedVideos.map((video) => (
              <Grid container spacing={3} key={video.video_id} sx={{ mb: 3 }}>
                {/* Texte descriptif à gauche */}
                <Grid item xs={8}>
                  <Typography variant="h5" sx={{ fontSize: '1.4rem' }}>{video.title}</Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{video.channel_name}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{`Durée: ${video.duration}`}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{`Vues: ${video.view_count}`}</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>{`Likes: ${video.like_count}`}</Typography>
                </Grid>

                {/* Vidéo intégrée à droite */}
                <Grid item xs={4}>
                  <iframe
                    width="100%"
                    height="315"
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
          <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>Aucune recommandation trouvée</Typography>
        )}
      </Box>
    </Box>
  );
};

export default Stats;
