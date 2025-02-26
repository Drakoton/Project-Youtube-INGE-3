import Sidebar from '../components/Sidebar';
import { Box, Typography } from '@mui/material';

export default function Stats() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4">Statistiques</Typography>
        <Typography>Page des statistiques en construction...</Typography>
      </Box>
    </Box>
  );
}
