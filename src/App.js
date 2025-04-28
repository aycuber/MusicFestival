// App.js
import React, { useState, useEffect } from 'react';
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
import UserProfilePage from './pages/UserProfilePage';  // ← new

// Node-ref map for animated transitions
const nodeRefMap = new Map();

function AnimatedRoutes() {
  const location = useLocation();
  const nodeRef = nodeRefMap.get(location.key) ?? React.createRef();
  nodeRefMap.set(location.key, nodeRef);

  // current user check
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

            {/* protected routes */}
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

            {/* public/other */}
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/festival/:id" element={<FestivalDetailsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/account-setup" element={<AccountSetup />} />
            <Route path="/profile/:friendId" element={<FriendProfilePage />} />
            <Route path="/messaging/:chatId" element={<MessagingPage />} />
            <Route path="/users/:uid" element={<UserProfilePage />} />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}

// This inner component runs inside the Router so we can read useLocation
function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* hide AppBar on the account-setup screen */}
      {location.pathname !== '/account-setup' && <MyAppBar />}
      <AnimatedRoutes />
    </>
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
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
