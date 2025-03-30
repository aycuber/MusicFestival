// HomePage.js
import React from 'react';
import { Container, Typography } from '@mui/material';

function HomePage() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
          >
          Welcome to YourTune!
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.primary' }}>
        Discover the best music festivals tailored to your taste.
      </Typography>
    </Container>
  );
}

export default HomePage;
