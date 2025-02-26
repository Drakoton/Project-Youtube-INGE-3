import Sidebar from '../components/Sidebar';
import { Box, Typography, TextField, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (searchTerm.trim() === '') return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?video_id=${searchTerm}`);
      if (!res.ok) throw new Error('Erreur lors de la recherche');
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4">Rapports</Typography>
        <TextField
          label="Rechercher un ID"
          variant="outlined"
          fullWidth
          sx={{ my: 2 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        {loading && <CircularProgress />}
        {error && <Typography color="error">Erreur: {error}</Typography>}
        {searchResult && (
          <Box>
            <Typography variant="h6">Résultats :</Typography>
            
            {/* 🔹 Affichage des sentiments en texte */}
            <Typography variant="body1">
              {`Commentaires positifs : ${searchResult.comments_sentiments.positif || 0} | `}
              {`Neutres : ${searchResult.comments_sentiments.neutre || 0} | `}
              {`Négatifs : ${searchResult.comments_sentiments.négatif || 0}`}
            </Typography>

            <Typography variant="h6" sx={{ mt: 4 }}>Distribution des scores de sentiment des commentaires :</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={searchResult.comments_distribution}>
                <XAxis dataKey="score" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
}
