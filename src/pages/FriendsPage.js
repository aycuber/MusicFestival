import React from 'react';
import { Container, Typography, List, ListItem, ListItemText, Avatar } from '@mui/material';

function FriendsPage() {
  const friends = [
    { id: 1, name: 'Friend A', avatar: 'https://via.placeholder.com/40' },
    { id: 2, name: 'Friend B', avatar: 'https://via.placeholder.com/40' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Your Friends
      </Typography>
      <List>
        {friends.map((friend) => (
          <ListItem key={friend.id}>
            <Avatar src={friend.avatar} sx={{ mr: 2 }} />
            <ListItemText primary={friend.name} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default FriendsPage;