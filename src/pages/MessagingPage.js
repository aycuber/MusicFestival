// MessagingPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Avatar
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function MessagingPage() {
  const { friendId } = useParams();
  const [friendData, setFriendData] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !friendId) return;

    // 1) compute a stable chatId
    const uids = [user.uid, friendId].sort();
    const key = `${uids[0]}_${uids[1]}`;
    setChatId(key);

    // 2) ensure the chat doc exists
    const chatRef = doc(db, 'chats', key);
    getDoc(chatRef)
      .then((snap) => {
        if (!snap.exists()) {
          return setDoc(chatRef, { participants: uids });
        }
      })
      .catch(console.error);

    // 3) listen in real-time to messages
    const msgsCol = collection(db, 'chats', key, 'messages');
    const q = query(msgsCol, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(msgs);
        setLoading(false);
        // scroll to bottom
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (err) => {
        console.error('Message listener error:', err);
        setLoading(false);
      }
    );

    // 4) load friend’s profile for their name/avatar
    const friendRef = doc(db, 'users', friendId);
    getDoc(friendRef)
      .then((snap) => {
        if (snap.exists()) setFriendData(snap.data());
      })
      .catch(console.error);

    return () => unsub();
  }, [friendId]);

  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user || !chatId || !newMessage.trim()) return;
    const msgsCol = collection(db, 'chats', chatId, 'messages');
    try {
      await addDoc(msgsCol, {
        sender: user.uid,
        text: newMessage.trim(),
        timestamp: new Date()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Messages with {friendData ? friendData.username : '...'}
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              maxHeight: 400,
              overflowY: 'auto',
              mb: 2,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 1,
              p: 1
            }}
          >
            <List>
              {messages.map((msg) => (
                <ListItem key={msg.id} alignItems="flex-start">
                  <Avatar
                    sx={{ mr: 2 }}
                    src={
                      msg.sender === auth.currentUser.uid
                        ? auth.currentUser.photoURL
                        : friendData?.profilePicture
                    }
                  />
                  <ListItemText
                    primary={msg.text}
                    secondary={new Date(msg.timestamp?.toDate?.() || msg.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
              <div ref={endRef} />
            </List>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Type a message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button variant="contained" onClick={sendMessage}>
              Send
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
