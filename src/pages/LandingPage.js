import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 4,
      }}
    >
      <Typography variant="h1" sx={{ mb: 2 }}>
        Welcome to VibeConnect
      </Typography>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Discover & Connect with Music Lovers
      </Typography>

      <Button
        variant="contained"
        color="primary"
        sx={{ fontSize: '1.2rem', px: 4, py: 1.5 }}
        onClick={() => navigate('/signup')}
      >
        Get Started
      </Button>
    </Box>
  );
}

export default LandingPage;
