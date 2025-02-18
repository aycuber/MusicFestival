import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Container, Button } from '@mui/material';
import { AccountCircle, Mail, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Top Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          {/* Logo (Home Button) */}
          <IconButton color="inherit" onClick={() => navigate('/home')}>
            <Home />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MusicFest
          </Typography>

          {/* Navigation Buttons */}
          <Button color="inherit" onClick={() => navigate('/explore')}>
            Explore
          </Button>
          <Button color="inherit" onClick={() => navigate('/search')}>
            Search
          </Button>
          <Button color="inherit" onClick={() => navigate('/friends')}>
            Friends
          </Button>

          {/* Message Icon */}
          <IconButton color="inherit" onClick={() => navigate('/messaging')}>
            <Mail />
          </IconButton>

          {/* Profile Photo */}
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Home Page Content */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Welcome to MusicFest!
        </Typography>
        <Typography variant="body1" sx={{ color: '#555' }}>
          Discover the best music festivals tailored to your taste.
        </Typography>
      </Container>
    </Box>
  );
}

export default HomePage;