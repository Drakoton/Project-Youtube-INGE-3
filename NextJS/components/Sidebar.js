// components/Sidebar.js
import Link from 'next/link';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';

const Sidebar = () => {
  return (
    <Drawer variant="permanent" sx={{ width: 240 }}>
      <List>
        <ListItem button component={Link} href="/">
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} href="/stats">
          <ListItemText primary="Statistiques" />
        </ListItem>
        <ListItem button component={Link} href="/reports">
          <ListItemText primary="Rapports" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
