// theme.js
import React from 'react';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AccountCircle, Mail, Home } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import {doc, getDoc} from 'firebase/firestore';
import {useState, useEffect} from 'react';
import {db, auth} from "../firebase";
import { getAuth} from 'firebase/auth';

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

const [profilePicture, setProfilePicture] = useState(null);

useEffect(() => {
  const fetchProfile = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setProfilePicture(data.profilePicture);
      }
    }
  };

  fetchProfile();
}, []);
  const user = auth.currentUser;
  const photoURL = user ? user.photoURL : null;
  const displayName = user?.displayName || 'Profile';
  console.log('photoURL', photoURL)
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
        <img
        src="/yourtune-logo.png"  // if using public folder
        alt="YourTune"
        style={{ height: 32, width: 'auto' }}  // adjust size as needed
        />
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
          <IconButton
            color="inherit"
            component={Link}
            to="/search"
            sx={{ mr: 1, mt: { xs: 1, sm: 0 } }}
          >
            <SearchIcon />
          </IconButton>

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
          <IconButton color="inherit"
          component = {Link}
          to = "/profile"
          sx = {{mr: 1, mt: {xs: 1, sm:0}}}
          >
          {profilePicture ? (
          <Avatar alt="User Photo" src={profilePicture} sx={{ width: 32, height: 32 }} />
          ) : (
          <AccountCircle sx={{ width: 32, height: 32 }} />
          )}
</IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default theme;
