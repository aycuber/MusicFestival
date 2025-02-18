import React from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText } from '@mui/material';

function GroupsPage() {
  const groups = [
    { id: 1, name: 'Group A', description: 'EDM lovers' },
    { id: 2, name: 'Group B', description: 'Techno fans' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Groups
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
        Create New Group
      </Button>
      <List>
        {groups.map((group) => (
          <ListItem key={group.id}>
            <ListItemText primary={group.name} secondary={group.description} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default GroupsPage;