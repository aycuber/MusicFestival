import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;