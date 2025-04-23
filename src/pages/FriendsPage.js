// src/pages/FriendsPage.js
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  List,
  ListItem,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState([]);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const fetchFriendData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Incoming friend requests
      const reqQ = query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending')
      );
      const reqSnap = await getDocs(reqQ);
      const requests = await Promise.all(
        reqSnap.docs.map(async docSnap => {
          const data = docSnap.data();
          const u = await getDoc(doc(db, 'users', data.from));
          return {
            id: docSnap.id,
            from: data.from,
            fromUsername: u.exists() ? u.data().username : 'Unknown',
            profilePicture: u.exists() ? u.data().profilePicture : '',
            status: data.status
          };
        })
      );
      setFriendRequests(requests);

      // Outgoing friend requests
      const sentQ = query(
        collection(db, 'friendRequests'),
        where('from', '==', user.uid),
        where('status', '==', 'pending')
      );
      const sentSnap = await getDocs(sentQ);
      const sentList = await Promise.all(
        sentSnap.docs.map(async docSnap => {
          const toId = docSnap.data().to;
          const u = await getDoc(doc(db, 'users', toId));
          return {
            id: toId,
            username: u.exists() ? u.data().username : 'Unknown',
            profilePicture: u.exists() ? u.data().profilePicture : ''
          };
        })
      );
      setFriends(sentList);

      // Accepted friends
      const accQ = query(
        collection(db, 'friends'),
        where('users', 'array-contains', user.uid),
        where('status', '==', 'accepted')
      );
      const accSnap = await getDocs(accQ);
      const accList = await Promise.all(
        accSnap.docs.map(async docSnap => {
          const ids = docSnap.data().users;
          const friendId = ids.find(id => id !== user.uid);
          const u = await getDoc(doc(db, 'users', friendId));
          if (!u.exists()) return null;
          return {
            id: friendId,
            username: u.data().username,
            profilePicture: u.data().profilePicture
          };
        })
      );
      setAcceptedFriends(accList.filter(Boolean));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch friend data');
    }
  };

  useEffect(() => {
    fetchFriendData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const usersQ = query(
        collection(db, 'users'),
        where('username', '==', searchQuery)
      );
      const snap = await getDocs(usersQ);
      if (snap.empty) {
        setError('No users found');
        setSearchResults([]);
      } else {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async toUserId => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      await setDoc(
        doc(db, 'friendRequests', `${user.uid}_${toUserId}`),
        { from: user.uid, to: toUserId, status: 'pending' }
      );
      setSentRequests(prev => new Set(prev).add(toUserId));
      alert('Friend request sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async requestId => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const reqRef = doc(db, 'friendRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      const { from } = reqSnap.data();
      await setDoc(
        doc(db, 'friends', `${user.uid}_${from}`),
        { users: [user.uid, from], status: 'accepted' }
      );
      await updateDoc(reqRef, { status: 'accepted' });
      alert('Friend request accepted!');
      fetchFriendData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRequestButton = userId => {
    if (sentRequests.has(userId)) {
      return (
        <Button variant="contained" color="secondary" disabled>
          Pending
        </Button>
      );
    }
    return (
      <Button
        variant="contained"
        color="primary"
        onClick={() => sendFriendRequest(userId)}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Add Friend'}
      </Button>
    );
  };

  const removeFriend = async friendId => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const doc1 = doc(db, 'friends', `${user.uid}_${friendId}`);
      const doc2 = doc(db, 'friends', `${friendId}_${user.uid}`);
      await Promise.all([
        deleteDoc(doc1).catch(() => {}),
        deleteDoc(doc2).catch(() => {})
      ]);
      alert('Friend removed!');
      fetchFriendData();
    } catch (err) {
      console.error(err);
      setError('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Find Friend
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Search by username"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>

      {/* Search Results */}
      <Typography variant="h6">Search Results</Typography>
      <List>
        {searchResults.map(user => (
          <ListItem key={user.id}>
            <Box
              onClick={() => navigate(`/users/${user.id}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexGrow: 1,
                cursor: 'pointer'
              }}
            >
              <Avatar src={user.profilePicture} />
              <Typography>{user.username}</Typography>
            </Box>
            {renderRequestButton(user.id)}
          </ListItem>
        ))}
      </List>

      {/* Incoming Requests */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Friend Requests (Received)
      </Typography>
      <List>
        {friendRequests.length === 0 ? (
          <Typography>No incoming requests.</Typography>
        ) : (
          friendRequests.map(req => (
            <ListItem key={req.id}>
              <Box
                onClick={() => navigate(`/users/${req.from}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexGrow: 1,
                  cursor: 'pointer'
                }}
              >
                <Avatar src={req.profilePicture} />
                <Typography>Request from {req.fromUsername}</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => acceptFriendRequest(req.id)}
                disabled={loading}
              >
                Accept
              </Button>
            </ListItem>
          ))
        )}
      </List>

      {/* Your Friends */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Your Friends
      </Typography>
      <List>
        {acceptedFriends.length === 0 ? (
          <Typography>No friends yet.</Typography>
        ) : (
          acceptedFriends.map(fr => (
            <ListItem key={fr.id}>
              <Box
                onClick={() => navigate(`/users/${fr.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexGrow: 1,
                  cursor: 'pointer'
                }}
              >
                <Avatar src={fr.profilePicture} />
                <Typography>{fr.username}</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate(`/messaging/${fr.id}`)}
              >
                Message
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeFriend(fr.id)}
                sx={{ ml: 1 }}
              >
                Remove
              </Button>
            </ListItem>
          ))
        )}
      </List>
    </Container>
  );
}

export default FriendsPage;
