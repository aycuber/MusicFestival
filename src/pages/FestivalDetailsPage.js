import React from 'react';
import { Container, Typography, Box, Rating, List, ListItem, ListItemText } from '@mui/material';

function FestivalDetailsPage() {
  const festival = {
    name: 'Festival A',
    description: 'A great EDM festival.',
    rating: 4.5,
    attendees: ['Friend A', 'Friend B'],
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        {festival.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {festival.description}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Rating value={festival.rating} readOnly />
        <Typography variant="body2" sx={{ ml: 1 }}>
          ({festival.rating})
        </Typography>
      </Box>
      <Typography variant="h6" gutterBottom>
        Who's Going:
      </Typography>
      <List>
        {festival.attendees.map((attendee, index) => (
          <ListItem key={index}>
            <ListItemText primary={attendee} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default FestivalDetailsPage;