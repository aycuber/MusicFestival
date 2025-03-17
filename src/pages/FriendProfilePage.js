import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Avatar, CircularProgress } from '@mui/material';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function FriendProfilePage({ friendId }) {
  const [friendData, setFriendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch friend data on component mount
  useEffect(() => {
    const fetchFriendData = async () => {
      setLoading(true);
      setError('');

      try {
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (friendDoc.exists()) {
          setFriendData(friendDoc.data());
        } else {
          setError('Friend not found');
        }
      } catch (err) {
        setError('Failed to fetch friend data');
      } finally {
        setLoading(false);
      }
    };

    fetchFriendData();
  }, [friendId]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        {friendData?.email}'s Profile
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Avatar src={friendData?.profilePicture} sx={{ width: 100, height: 100 }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        Bio
      </Typography>
      <Typography variant="body1" gutterBottom>
        {friendData?.bio || 'No bio available.'}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Music Tastes
      </Typography>
      <Typography variant="body1" gutterBottom>
        {friendData?.genres?.join(', ') || 'No music tastes selected.'}
      </Typography>
    </Container>
  );
}

export default FriendProfilePage;