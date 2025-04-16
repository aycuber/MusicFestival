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

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9c27b0', // Vibrant purple accent
    },
    secondary: {
      main: '#e91e63', // Bright pink accent
    },
    background: {
      default: '#121212',  // Typical dark background
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    },
  },
  typography: {
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
          background: 'linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)',
          flexWrap: 'wrap',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
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
        {/* Logo/Home Icon => navigates to "/" */}
        <IconButton
          color="inherit"
          component={Link}
          to="/"
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
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          YourTune
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Button
            color="inherit"
            component={Link}
            to="/explore"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            Explore
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/search"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            Search
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/friends"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            Friends
          </Button>
          
          {/* NEW: Groups button */}
          <Button
            color="inherit"
            component={Link}
            to="/groups"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            Groups
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
