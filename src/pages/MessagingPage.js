import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, TextField, Button, CircularProgress, Avatar } from '@mui/material';
import { useParams } from 'react-router-dom'; // To get friendId from URL
import { auth, db } from '../firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

function MessagingPage() {
  const { friendId } = useParams();  // Get friendId from the URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [friendData, setFriendData] = useState(null);

  useEffect(() => {
    if (!friendId) {
      setError('Friend ID is missing.');
      console.error('Friend ID is missing!');
      return;
    }

    const fetchMessages = async () => {
      const user = auth.currentUser;
      if (!user || !friendId) return;

      // Fetching the messages between the user and the friend
      const messagesQuery = query(
        collection(db, 'messages'),
        where('users', 'array-contains', user.uid),
        where('users', 'array-contains', friendId)
      );

      try {
        const snapshot = await getDocs(messagesQuery);
        const fetchedMessages = snapshot.docs.map((doc) => doc.data());
        setMessages(fetchedMessages);
      } catch (err) {
        setError('Failed to load messages');
        console.error('Error loading messages:', err);
      }
    };

    const fetchFriendData = async () => {
      try {
        // Validate if friendId is a valid string
        if (typeof friendId !== 'string' || friendId.trim() === '') {
          throw new Error('Invalid friendId');
        }

        const friendDocRef = doc(db, 'users', friendId);
        const friendDoc = await getDoc(friendDocRef);

        // Check if the friend document exists
        if (friendDoc.exists()) {
          setFriendData(friendDoc.data());
        } else {
          setError('Friend not found');
          console.error('Friend document not found in Firestore');
        }
      } catch (err) {
        setError('Failed to load friend data');
        console.error('Error loading friend data:', err);
      }
    };

    // Fetch both messages and friend data
    fetchMessages();
    fetchFriendData();
  }, [friendId]);

  const sendMessage = async () => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      await setDoc(doc(db, 'messages', `${user.uid}_${friendId}`), {
        users: [user.uid, friendId],
        messages: arrayUnion({
          sender: user.uid,
          text: newMessage,
          timestamp: new Date(),
        }),
      });

      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Messages with {friendData ? friendData.username : 'Loading...'}
      </Typography>

      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Message List */}
      <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2 }}>
        <List>
          {messages.map((message, index) => (
            <ListItem key={index}>
              <Avatar sx={{ mr: 2 }} src={message.sender === auth.currentUser?.uid ? auth.currentUser.photoURL : friendData?.profilePicture} />
              <ListItemText primary={message.text} secondary={new Date(message.timestamp?.seconds * 1000).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Input for new messages */}
      <TextField
        fullWidth
        label="Type a message"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={sendMessage}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send'}
      </Button>
    </Container>
  );
}

export default MessagingPage;
