import React, { useState } from 'react';
import { Container, Typography, TextField, Button, List, ListItem, ListItemText } from '@mui/material';

function MessagingPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey, are you going to Festival A?', sender: 'Friend A' },
    { id: 2, text: 'Yes, I am!', sender: 'You' },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: message, sender: 'You' }]);
      setMessage('');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Messages
      </Typography>
      <List>
        {messages.map((msg) => (
          <ListItem key={msg.id}>
            <ListItemText
              primary={msg.text}
              secondary={`Sent by: ${msg.sender}`}
            />
          </ListItem>
        ))}
      </List>
      <TextField
        fullWidth
        label="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mt: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleSend} sx={{ mt: 2, fontWeight: 'bold' }}>
        Send
      </Button>
    </Container>
  );
}

export default MessagingPage;