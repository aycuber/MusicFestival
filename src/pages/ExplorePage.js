import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material';
import axios from 'axios';
import { auth, db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { Box } from '@mui/material';
import { logInteraction } from '../utils/logInteractions';

function ExplorePage() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);

  const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

  // Fetch user data on component mount or set default genre if not signed in
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        // Not signed in: use a default keyword (e.g., "EDM")
        setSelectedGenres(['EDM']);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User Data:', userData);
          setSelectedGenres(userData.genres || []);
        }
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, []);

  // Fetch events from Ticketmaster using genres as keywords
  useEffect(() => {
    if (selectedGenres.length === 0) return;

    const fetchFestivals = async () => {
      setLoading(true);
      try {
        const keywords = selectedGenres[0];
        console.log('Using Keywords:', keywords);
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
          params: {
            apikey: TICKETMASTER_API_KEY,
            classificationName: 'music',
            keyword: keywords,
            size: 20,
          },
        });
        console.log('Event Response:', response.data);

        const events = response.data._embedded?.events || [];
        const festivalData = events.map(event => ({
          id: event.id,
          name: event.name,
          image: event.images.find(img => img.ratio === '16_9')?.url || 'https://via.placeholder.com/300',
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
  }, [selectedGenres]);

  if (loading) {
    return (
        <Box
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
          }}
        >
          <LoadingSpinner />
        </Box>
      );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ fontWeight: 'bold', color: 'text.primary' }}
      >
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
                <Box sx = {{display: 'flex', mt: 2}}>
                <Button
                  variant="contained"
                  onClick = {() => {
                    console.log('Learn More clicked', festival.id);
                    logInteraction(festival.id, 0.5);   //moderate interest in the festival/event
                    window.open(festival.url, '_blank');
                  }}
                  color="primary"
                  href={festival.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </Button>
                <Button
                variant = "contained"
                onClick = {() => {
                  logInteraction(festival.id, 1);   //high interest in the festival/event
                  window.open(festival.url, '_blank');
                }}
                color = "primary"
                sx = {{ml : 1}}
                href = {festival.url}
                target = "_blank"
                rel = "noopener noreferrer"
                >
                  Buy Now
                </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ExplorePage;
