import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Avatar } from '@mui/material';

function ProfilePage() {
  const [bio, setBio] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save bio and other profile changes
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Your Profile
      </Typography>
      <Avatar sx={{ width: 100, height: 100, mb: 2 }} />
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold' }}>
          Save Changes
        </Button>
      </form>
    </Container>
  );
}

export default ProfilePage;