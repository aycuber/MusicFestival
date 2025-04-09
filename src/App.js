// App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { auth } from './firebase';
import theme, { MyAppBar } from './theme/theme';

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
import LoadingSpinner from './components/LoadingSpinner';

/**
 * A small helper to store nodeRefs for each location.key,
 * so each transition uses its own DOM node reference
 */
const nodeRefMap = new Map();

function AnimatedRoutes() {
  const location = useLocation();
  // Prepare a nodeRef for the current location key
  let nodeRef = nodeRefMap.get(location.key);
  if (!nodeRef) {
    nodeRef = React.createRef();
    nodeRefMap.set(location.key, nodeRef);
  }

  // Check if user is logged in
  const user = auth.currentUser;

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.key}
        classNames="fade"
        timeout={1400}
        nodeRef={nodeRef}
      >
        <div ref={nodeRef}>
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />

            {/* If user not logged in, redirect to /signup for these routes */}
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/signup" replace />}
            />
            <Route
              path="/friends"
              element={user ? <FriendsPage /> : <Navigate to="/signup" replace />}
            />
            <Route
              path="/messaging"
              element={user ? <MessagingPage /> : <Navigate to="/signup" replace />}
            />

            {/* Other routes remain the same */}
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/festival/:id" element={<FestivalDetailsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/account-setup" element={<AccountSetup />} />
            <Route path="/profile/:friendId" element={<FriendProfilePage />} />
            <Route path="/messages/:friendId" element={<MessagingPage />} />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
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
          backgroundColor: 'black',
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
        {window.location.pathname !== '/account-setup' && <MyAppBar />}
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
