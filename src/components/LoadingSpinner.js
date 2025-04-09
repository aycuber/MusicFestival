// LoadingSpinner.js
import React from 'react';
import { Box, keyframes } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

// A simple rotation keyframe: one full revolution
const spin = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

function LoadingSpinner() {
  return (
    <Box
      sx={{
        width: 80,
        height: 80,
        position: 'relative',
        // Spin the entire container so the partial gradient and note revolve
        animation: `${spin} 1.3s linear infinite`,
        borderRadius: '50%',
        // Create a partial arc from 270deg to 330deg with a gradient from purple to pink
        // then transparent from 330deg to 360. Adjust angles to enlarge or shrink the arc.
        background: `
          conic-gradient(
            from 270deg,
            #9c27b0 0deg 20deg,
            #e91e63 20deg 60deg,
            transparent 60deg 360deg
          )
        `,
        // A mask to create a "ring" shape if you want it hollow; remove if you prefer a filled shape
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 10px), black 0)',
      }}
    >
      {/* Place the music note at the top center (leading edge).
          Because the container is spinning, the note travels around the arc. */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)', // center horizontally
        }}
      >
        <MusicNoteIcon
          sx={{
            color: '#fff',
            fontSize: '1.4rem',
          }}
        />
      </Box>
    </Box>
  );
}

export default LoadingSpinner;
