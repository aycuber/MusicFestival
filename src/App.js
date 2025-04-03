// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

import { auth } from './firebase'; // <-- Adjust path if needed
import theme, { MyAppBar } from './theme/theme';

import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import FriendsPage from './pages/FriendsPage';
import MessagingPage from './pages/MessagingPage';
import FestivalDetailsPage from './pages/FestivalDetailsPage';
import GroupsPage from './pages/GroupsPage';
import AccountSetup from './pages/AccountSetup';
import FriendProfilePage from './pages/FriendProfilePage';

function App() {
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Ensure we always use local persistence so user stays logged in
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // Once persistence is set, watch for sign-in state changes
        const unsubscribe = onAuthStateChanged(auth, () => {
          // Once we know user or no user, we stop the loader
          setAuthLoading(false);
        });
        return () => unsubscribe();
      })
      .catch((err) => {
        console.error('Failed to set persistence:', err);
        setAuthLoading(false);
      });
  }, []);

  // Optional: Show a loader until Firebase has confirmed the user's sign-in state
  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        {/* Conditionally hide top bar if route = /account-setup */}
        {window.location.pathname !== '/account-setup' && <MyAppBar />}

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/festival/:id" element={<FestivalDetailsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/account-setup" element={<AccountSetup />} />
          <Route path="/profile/:friendId" element={<FriendProfilePage />} />
          <Route path="/messages/:friendId" element={<MessagingPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
