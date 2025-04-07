// theme.js
import React from 'react';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AccountCircle, Mail, Home } from '@mui/icons-material';

/**
 * 1) Define your MUI theme
 */
let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      // Vibrant purple accent
      main: '#9c27b0',
    },
    secondary: {
      // Bright pink accent
      main: '#e91e63',
    },
    background: {
      // Typical dark background
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    },
  },
  typography: {
    // Font families often used for modern EDM vibes
    fontFamily: 'Montserrat, Roboto, sans-serif',
    h6: {
      fontWeight: 700,
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Add a subtle gradient effect to the AppBar
          background: 'linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)',
          // Let content wrap if it's too narrow on mobile
          flexWrap: 'wrap',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Keep text as is, more modern feel
          borderRadius: 6,
        },
      },
    },
  },
});

// Make typography respond to screen size
theme = responsiveFontSizes(theme);

/**
 * 2) Create a reusable top bar component
 *    that will be rendered on every page.
 */
export const MyAppBar = () => {
  return (
    <AppBar id="topbar" position="static">
      <Toolbar sx={{ flexWrap: 'wrap' }}>
        {/* Logo/Home Icon => navigates to "/home" */}
        <IconButton
          color="inherit"
          component={Link}
          to="/home"
          sx={{ mr: 1 }}
        >
          <Home />
        </IconButton>

        {/* YourTune brand text */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            // On very small screens, reduce font size a bit
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          YourTune
        </Typography>

        {/* Desktop/Tablet Nav Buttons
            Let them wrap if there's no space
          */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button color="inherit" component={Link} to="/explore" sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}>
            Explore
          </Button>
          <Button color="inherit" component={Link} to="/search" sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}>
            Search
          </Button>
          <Button color="inherit" component={Link} to="/friends" sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}>
            Friends
          </Button>

          {/* Message Icon => navigates to "/messaging" */}
          <IconButton
            color="inherit"
            component={Link}
            to="/messaging"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            <Mail />
          </IconButton>

          {/* Profile Icon => navigates to "/profile" */}
          <IconButton
            color="inherit"
            component={Link}
            to="/profile"
            sx={{ mt: { xs: 1, sm: 0 } }}
          >
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default theme;
