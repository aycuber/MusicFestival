import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, List, ListItem, ListItemText, Avatar, CircularProgress } from '@mui/material';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

function MessagingPage({ friendId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch messages on component mount
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !friendId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('users', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [friendId]);

  // Send a new message
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Messages
      </Typography>
      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
      <List>
        {messages.map((message) => (
          <ListItem key={message.id}>
            <Avatar src={message.sender === auth.currentUser?.uid ? auth.currentUser.photoURL : friendId.profilePicture} sx={{ mr: 2 }} />
            <ListItemText primary={message.text} secondary={new Date(message.timestamp).toLocaleString()} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
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
      </Box>
    </Container>
  );
}

export default MessagingPage;