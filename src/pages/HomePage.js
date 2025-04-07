import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { keyframes } from '@mui/system';

// Keyframes where color transitions occur faster
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

function HomePage() {
  const [notes, setNotes] = useState([]);
  const [isOverTopbar, setIsOverTopbar] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(64); 

  useEffect(() => {
    const topBar = document.getElementById('topbar');
    if (topBar) {
      setTopBarHeight(topBar.offsetHeight || 64);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.pageY <= topBarHeight) {
        setIsOverTopbar(true);
        return;
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

  const handleAnimationEnd = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: 'black',
        overflow: 'hidden',
        cursor: isOverTopbar ? 'default' : 'none',
      }}
    >
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
            // The animation is 1.5s total, but color shift happens by 40%
            animation: `${fadeOut} 1.5s forwards`,
          }}
        >
          <MusicNoteIcon fontSize="inherit" />
        </Box>
      ))}

      <Container sx={{ mt: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
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
      </Container>
    </Box>
  );
}

export default HomePage;
