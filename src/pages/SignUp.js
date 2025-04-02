import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CircularProgress
} from '@mui/material';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      // 1) Check if username is already taken
      const q = query(collection(db, 'users'), where('username', '==', username));
      const qSnap = await getDocs(q);

      if (!qSnap.empty) {
        throw new Error('Username already taken. Please choose another.');
      }

      // 2) Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3) Create the user doc in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        friends: [],
        bio: '',
        profilePicture: '',
      });

      navigate('/home');
    } catch (err) {
      setError(err.message);
      console.error('Error signing up:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}
      >
        Create Your Account
      </Typography>

      {error && (
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setUsername(e.target.value)}
      />

      <TextField
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ fontWeight: 'bold', py: 1.5 }}
        onClick={handleSignUp}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign Up'}
      </Button>
    </Container>
  );
}

export default SignUp;
