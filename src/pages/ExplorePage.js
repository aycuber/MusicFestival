import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';
import axios from 'axios';

function ExplorePage() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
          params: {
            apikey: TICKETMASTER_API_KEY,
            classificationName: 'music',
            keyword: 'festival',
            size: 20,
          },
        });

        const events = response.data._embedded?.events || [];
        const festivalData = events.map(event => ({
          id: event.id,
          name: event.name,
          image: event.images.find(img => img.ratio === '16_9')?.url || 'https://via.placeholder.com/300',
          description: event.info || 'No description available.',
          url: event.url,
        }));

        setFestivals(festivalData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFestivals();
  }, [TICKETMASTER_API_KEY]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

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
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  href={festival.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
