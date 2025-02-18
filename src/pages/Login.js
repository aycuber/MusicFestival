import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add validation and backend logic here
    navigate('/home');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Log In
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold' }}>
          Log In
        </Button>
      </form>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          onClick={() => navigate('/signup')}
        >
          Log In with Google
        </Button>
      </Box>
    </Container>
  );
}

export default Login;