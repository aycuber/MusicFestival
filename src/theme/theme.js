import React from 'react';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Container,
  useScrollTrigger,
  Slide,
  Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  AccountCircle,
  Mail,
  Search,
  Group,
  People,
  ExploreOutlined
} from '@mui/icons-material';

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7e22ce', // Purple 700
      light: '#a855f7', // Purple 500
      dark: '#6a0080',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#2dd4bf', // Teal 400
      light: '#4fd1c5',
      dark: '#0d9488',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0f172a', // Slate 900
      paper: '#1e293b', // Slate 800
      elevated: '#334155' // Slate 700
    },
    text: {
      primary: '#f8fafc', // Slate 50
      secondary: '#cbd5e1' // Slate 300
    },
    divider: 'rgba(203, 213, 225, 0.08)'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em'
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.015em'
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(203, 213, 225, 0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        },
        contained: {
          background: 'linear-gradient(45deg, #7e22ce, #2dd4bf)',
          boxShadow: '0 4px 20px rgba(126, 34, 206, 0.2)',
          '&:hover': {
            background: 'linear-gradient(45deg, #6b21a8, #0d9488)',
            boxShadow: '0 8px 24px rgba(126, 34, 206, 0.3)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(203, 213, 225, 0.05)',
            '&:hover': {
              background: 'rgba(203, 213, 225, 0.08)'
            },
            '&.Mui-focused': {
              background: 'rgba(203, 213, 225, 0.1)'
            }
          }
        }
      }
    }
  }
});

theme = responsiveFontSizes(theme);

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export const MyAppBar = () => {
  return (
    <HideOnScroll>
      <AppBar position="fixed" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 72 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="https://yourtuneapp.com/yourtune-logo.png"
                  alt="YourTune"
                  style={{
                    height: '40px',
                    marginRight: '16px',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                />
              </Link>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {[
                { to: "/explore", icon: <ExploreOutlined />, label: "Explore" },
                { to: "/search", icon: <Search />, label: "Search" },
                { to: "/friends", icon: <People />, label: "Friends" },
                { to: "/groups", icon: <Group />, label: "Groups" }
              ].map((item) => (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  startIcon={item.icon}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-2px)',
                      background: 'rgba(126, 34, 206, 0.08)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <IconButton
                component={Link}
                to="/messaging"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'secondary.main',
                    transform: 'translateY(-2px)',
                    background: 'rgba(45, 212, 191, 0.08)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Mail />
              </IconButton>

              <IconButton
                component={Link}
                to="/profile"
                sx={{
                  background: 'linear-gradient(45deg, #7e22ce, #2dd4bf)',
                  padding: '8px',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6b21a8, #0d9488)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <AccountCircle sx={{ color: '#fff' }} />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </HideOnScroll>
  );
};

export default theme;