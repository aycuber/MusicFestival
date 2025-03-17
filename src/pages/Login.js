import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate the user with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        navigate('/profile', { state: { userData } });
      } else {
        setError('User data not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Authenticate the user with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        navigate('/profile', { state: { userData } });
      } else {
        // If user data doesn't exist, redirect to account setup
        navigate('/account-setup');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Log In
      </Typography>
      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Log In'}
        </Button>
      </form>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Log In with Google'}
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          onClick={() => navigate('/signup')}
        >
          Don't have an account? Sign Up
        </Button>
      </Box>
    </Container>
  );
}

export default Login;