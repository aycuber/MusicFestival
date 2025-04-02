// HomePage.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';

function HomePage() {
  return (
    <Container sx={{ mt: { xs: 2, sm: 4 } }}>
      <Box>
        {/* Responsive heading */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            // Adjust size on very small screens
            fontSize: { xs: '1.8rem', sm: '2.125rem' }, 
          }}
        >
          Welcome to YourTune!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.primary',
            fontSize: { xs: '0.95rem', sm: '1rem' },
          }}
        >
          Discover the best music festivals tailored to your taste.
        </Typography>
      </Box>
    </Container>
  );
}

export default HomePage;
