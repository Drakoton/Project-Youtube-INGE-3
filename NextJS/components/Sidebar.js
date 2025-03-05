// components/Sidebar.js
import Link from 'next/link';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Home, VideoLibrary, Stars } from '@mui/icons-material';

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 375,
        flexShrink: 0,
        bgcolor: '#FFF', // Bleu foncé
        color: '#FFF', // Texte blanc
        '& .MuiListItemIcon-root': { color: '#000' }, // Icônes blanches
      }}
    >
      <List sx={{ paddingTop: 2 }}>
        <ListItem button component={Link} href="/" sx={{ mb: 3 }}>
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Statistiques Globales" primaryTypographyProps={{ fontSize: '1.2rem' }} />
        </ListItem>

        <ListItem button component={Link} href="/reports" sx={{ mb: 3 }}>
          <ListItemIcon>
            <VideoLibrary />
          </ListItemIcon>
          <ListItemText primary="Rapports Vidéo" primaryTypographyProps={{ fontSize: '1.2rem' }} />
        </ListItem>

        <ListItem button component={Link} href="/stats" sx={{ mb: 3 }}>
          <ListItemIcon>
            <Stars />
          </ListItemIcon>
          <ListItemText primary="Recommandations" primaryTypographyProps={{ fontSize: '1.2rem' }} />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
