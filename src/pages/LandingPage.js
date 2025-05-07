import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Make sure to import auth
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { keyframes } from '@mui/system';

const fadeOut = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
    color: #9c27b0; /* Start color: purple */
  }
  60% {
    color: #e91e63; /* Switch to pink earlier in the animation */
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
    color: #e91e63; 
  }
`;

function LandingPage() {
  const navigate = useNavigate();

  // State for the music notes, top bar detection, etc.
  const [notes, setNotes] = useState([]);
  const [isOverTopbar, setIsOverTopbar] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(64); // Default if we can't measure

  // Determine if user is logged in
  const user = auth.currentUser;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: 'black',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 4,
        textAlign: 'center',
      }}
    >
      {/* Landing Page Text & Conditional Button */}
      <Typography variant="h2" sx={{ mb: 2, color: '#fff' }}>
        Welcome to YourTune
      </Typography>
      <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
        Discover & Connect with Music Lovers
      </Typography>

      {/* Show "Get Started" only if NOT logged in */}
      {!user && (
        <Button
          variant="contained"
          color="primary"
          sx={{ fontSize: '1.2rem', px: 4, py: 1.5 }}
          onClick={() => navigate('/signup')}
        >
          Get Started
        </Button>
      )}
    </Box>
  );
}

export default LandingPage;
