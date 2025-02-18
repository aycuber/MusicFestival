import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Find Your Next Event
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ color: '#555' }}>
        Discover music festivals tailored to your taste.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ mr: 2, fontWeight: 'bold' }}
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 'bold' }}
          onClick={() => navigate('/signup')}
        >
          Sign Up
        </Button>
      </Box>
    </Container>
  );
}

export default LandingPage;