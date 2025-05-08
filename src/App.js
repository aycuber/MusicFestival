import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './firebase';
import theme, { MyAppBar } from './theme/theme';

// Page imports
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import FriendsPage from './pages/FriendsPage';
import MessagingPage from './pages/MessagingPage';
import FestivalDetailsPage from './pages/FestivalDetailsPage';
import GroupsPage from './pages/GroupsPage';
import AccountSetup from './pages/AccountSetup';
import FriendProfilePage from './pages/FriendProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import LoadingSpinner from './components/LoadingSpinner';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

function AnimatedRoutes() {
  const location = useLocation();
  const user = auth.currentUser;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Login />} />
          <Route path="/friends" element={user ? <FriendsPage /> : <Login />} />
          <Route path="/messaging" element={user ? <MessagingPage /> : <Login />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/festival/:id" element={<FestivalDetailsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/account-setup" element={<AccountSetup />} />
          <Route path="/profile/:friendId" element={<FriendProfilePage />} />
          <Route path="/messaging/:chatId" element={<MessagingPage />} />
          <Route path="/users/:uid" element={<UserProfilePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();
  
  return (
    <Box sx={{ minHeight: '100vh', pt: location.pathname !== '/account-setup' ? '72px' : 0 }}>
      {location.pathname !== '/account-setup' && <MyAppBar />}
      <AnimatedRoutes />
    </Box>
  );
}

function App() {
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, () => {
          setAuthLoading(false);
        });
        return () => unsubscribe();
      })
      .catch((err) => {
        console.error('Failed to set persistence:', err);
        setAuthLoading(false);
      });
  }, []);

  if (authLoading) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(45deg, #030303, #121212)',
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;