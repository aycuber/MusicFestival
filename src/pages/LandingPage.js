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

  // Measure top bar's actual height on mount
  useEffect(() => {
    const topBar = document.getElementById('topbar');
    if (topBar) {
      setTopBarHeight(topBar.offsetHeight || 64);
    }
  }, []);

  // Mouse handling: skip notes if over the top bar, else spawn a note
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.pageY <= topBarHeight) {
        setIsOverTopbar(true);
        return; // no notes if over top bar
      } else {
        setIsOverTopbar(false);
      }

      const newNote = {
        id: Date.now() + Math.random(),
        x: e.pageX,
        y: e.pageY,
      };
      setNotes((prev) => [...prev, newNote]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [topBarHeight]);

  // Remove note once the fade-out animation ends
  const handleAnimationEnd = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  // Determine if user is logged in
  const user = auth.currentUser;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: 'black',
        cursor: isOverTopbar ? 'default' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 4,
        textAlign: 'center',
      }}
    >
      {/* Music notes trail */}
      {notes.map((note) => (
        <Box
          key={note.id}
          onAnimationEnd={() => handleAnimationEnd(note.id)}
          sx={{
            position: 'absolute',
            left: note.x,
            top: note.y - topBarHeight,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            fontSize: '2.5rem',
            animation: `${fadeOut} 1.5s forwards`,
          }}
        >
          <MusicNoteIcon fontSize="inherit" />
        </Box>
      ))}

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
