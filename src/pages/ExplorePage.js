import React from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';

function ExplorePage() {
  const festivals = [
    { id: 1, name: 'Festival A', image: 'https://via.placeholder.com/300', description: 'A great EDM festival.' },
    { id: 2, name: 'Festival B', image: 'https://via.placeholder.com/300', description: 'Techno beats all night.' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Explore Festivals
      </Typography>
      <Grid container spacing={3}>
        {festivals.map((festival) => (
          <Grid item key={festival.id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={festival.image}
                alt={festival.name}
              />
              <CardContent>
                <Typography variant="h6">{festival.name}</Typography>
                <Typography variant="body2">{festival.description}</Typography>
                <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ExplorePage;