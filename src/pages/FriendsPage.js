import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, List, ListItem, ListItemText, Avatar, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

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

  // Fetch friend requests and friends on component mount
  useEffect(() => {
    const fetchFriendData = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      try {
        // Fetch incoming friend requests (received)
        const friendRequestsQuery = query(
          collection(db, 'friendRequests'),
          where('to', '==', user.uid),
          where('status', '==', 'pending')
        );
        const friendRequestsSnapshot = await getDocs(friendRequestsQuery);
        const requests = await Promise.all(
          friendRequestsSnapshot.docs.map(async (docSnap) => {
            const requestData = docSnap.data();
            const fromUserDoc = await getDoc(doc(db, 'users', requestData.from));
            const fromUserData = fromUserDoc.exists() ? fromUserDoc.data() : {};
            return {
              id: docSnap.id,
              from: requestData.from,
              fromUsername: fromUserData.username,
              profilePicture: fromUserData.profilePicture,
              status: requestData.status,
            };
          })
        );
        setFriendRequests(requests);
  
        // Fetch sent friend requests (outgoing)
        const sentRequestsQuery = query(
          collection(db, 'friendRequests'),
          where('from', '==', user.uid),
          where('status', '==', 'pending')
        );
        const sentSnapshot = await getDocs(sentRequestsQuery);
        const sentList = await Promise.all(
          sentSnapshot.docs.map(async (docSnap) => {
            const toUserId = docSnap.data().to;
            const userDoc = await getDoc(doc(db, 'users', toUserId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            return {
              id: toUserId,
              username: userData.username,
              profilePicture: userData.profilePicture,
            };
          })
        );
        setFriends(sentList);
  
        // Fetch accepted friends
        const acceptedFriendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', user.uid),
          where('status', '==', 'accepted')
        );
        const acceptedSnapshot = await getDocs(acceptedFriendsQuery);
        const acceptedList = await Promise.all(
          acceptedSnapshot.docs.map(async (docSnap) => {
            const friendId = docSnap.data().users.find((uid) => uid !== user.uid);
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            const friendData = friendDoc.exists() ? friendDoc.data() : {};
            return {
              id: friendId,
              username: friendData.username,
              profilePicture: friendData.profilePicture,
            };
          })
        );
        setAcceptedFriends(acceptedList);
      } catch (err) {
        setError('Failed to fetch friend data');
        console.error(err);
      }
    };
  
    fetchFriendData();
  }, []);  

  // Search for users by username
  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      // Search for users by username
      const usersQuery = query(collection(db, 'users'), where('username', '==', searchQuery));
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        setError('No users found');
        setSearchResults([]);
        return;
      }

      const results = usersSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Send a friend request
  const sendFriendRequest = async (toUserId) => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      // Check if a request already exists
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('from', '==', user.uid),
        where('to', '==', toUserId)
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      // Create a new friend request
      await setDoc(doc(db, 'friendRequests', `${user.uid}_${toUserId}`), {
        from: user.uid,
        to: toUserId,
        status: 'pending',
      });
      //create a new set for sent requests and update state
      setSentRequests((prevSentRequests) => new Set(prevSentRequests).add(toUserId));

      alert('Friend request sent!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (requestId) => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      // Get the friend request data
      const requestDoc = doc(db, 'friendRequests', requestId);
      const requestData = (await getDoc(requestDoc)).data();

      // Add friend relationship in 'friends' collection
      await setDoc(doc(db, 'friends', `${user.uid}_${requestData.from}`), {
        users: [user.uid, requestData.from],
        status: 'accepted'
      });

// Update request status to accepted
await updateDoc(requestDoc, { status: 'accepted' });

      //Remove the friend request by updating its status
      await updateDoc(requestDoc, {status: 'accepted'});

      alert('Friend request accepted!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  //Render friend request button based on status
  const renderRequestButton = (userId) => {
    if (sentRequests.has(userId)) {
    return <Button variant = "contained" color = "secondary" disabled>Pending</Button>;
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

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Find Friend
      </Typography>
      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
      {/* Search Users */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Search by username"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick= {() => handleSearch()}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>
        Search Results
        </Typography>
        <List>
        {searchResults.map((user) => (
          <ListItem key={user.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Avatar src={user.profilePicture} />
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {user.username}
              </Typography>
            </Box>
            {renderRequestButton(user.id)}
          </ListItem>
        ))}
        </List>

        <Typography variant="h6" gutterBottom>
        Friend Requests (Received)
      </Typography>
      <List>
        {friendRequests.length === 0 ? (
          <Typography>No incoming friend requests.</Typography>
        ) : (
          friendRequests.map((request) => (
            <ListItem key={request.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                <Avatar src={request.profilePicture} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  Request from {request.fromUsername}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => acceptFriendRequest(request.id)}
                disabled={loading}
              >
                Accept
              </Button>
            </ListItem>
          ))
        )}
      </List>
      <Typography variant="h6" gutterBottom>
  Your Friends
</Typography>
<List>
  {acceptedFriends.length === 0 ? (
    <Typography>No friends yet.</Typography>
  ) : (
    acceptedFriends.map((friend) => (
      <ListItem key={friend.id}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Avatar src={friend.profilePicture} />
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {friend.username}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/messages/${friend.id}`)}
        >
          Message
        </Button>
      </ListItem>
    ))
  )}
</List>
    </Container>
  );
}
export default FriendsPage;