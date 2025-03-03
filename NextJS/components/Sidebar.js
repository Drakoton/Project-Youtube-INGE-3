// components/Sidebar.js
import Link from 'next/link';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Home, VideoLibrary, Stars } from '@mui/icons-material'; // Icônes de MUI

const Sidebar = () => {
  return (
    <Drawer 
      variant="permanent" 
      sx={{ 
        width: 250,  // Augmenter la largeur de la sidebar (passer de 300px à 400px)
        flexShrink: 0, // Éviter que la sidebar rétrécisse
        backgroundColor: '#f4f4f4', // Couleur de fond de la sidebar
        color: '#000', // Couleur du texte général de la sidebar
      }}
    >
      <List sx={{ paddingTop: 2 }}>  {/* Ajouter un espacement au sommet de la liste */}
        <ListItem 
          button 
          component={Link} 
          href="/" 
          sx={{ 
            marginBottom: 3,  // Espacer les éléments verticalement
          }}
        >
          <ListItemIcon sx={{ color: '#000', fontSize: '30px' }}>  {/* Icône plus grande */}
            <Home />
          </ListItemIcon>
          <ListItemText 
            primary="Statistiques Globales" 
            sx={{ fontSize: '22px', color: '#000' }} // Texte plus grand
          />
        </ListItem>
        <ListItem 
          button 
          component={Link} 
          href="/reports" 
          sx={{ 
            marginBottom: 3,  // Espacer les éléments verticalement
          }}
        >
          <ListItemIcon sx={{ color: '#000', fontSize: '30px' }}>  {/* Icône plus grande */}
            <VideoLibrary />
          </ListItemIcon>
          <ListItemText 
            primary="Rapports Vidéo" 
            sx={{ fontSize: '22px', color: '#000' }} // Texte plus grand
          />
        </ListItem>
        <ListItem 
          button 
          component={Link} 
          href="/stats"
          sx={{ marginBottom: 3 }}  // Espacer les éléments verticalement
        >
          <ListItemIcon sx={{ color: '#000', fontSize: '30px' }}>  {/* Icône plus grande */}
            <Stars />
          </ListItemIcon>
          <ListItemText 
            primary="Recommandations" 
            sx={{ fontSize: '22px', color: '#000' }} // Texte plus grand
          />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
