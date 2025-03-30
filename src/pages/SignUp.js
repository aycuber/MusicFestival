import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        friends: [],
        bio: '',
        profilePicture: '',
      });

      navigate('/home');
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 4,
      }}
    >
      <Typography variant="h1" sx={{ mb: 3 }}>
        Create Your Account
      </Typography>

      <TextField
        label="Username"
        variant="filled"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setUsername(e.target.value)}
      />

      <TextField
        label="Email"
        variant="filled"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        variant="filled"
        fullWidth
        sx={{ mb: 2 }}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2, fontSize: '1.2rem', px: 4, py: 1.5 }}
        onClick={handleSignUp}
      >
        Sign Up
      </Button>
    </Box>
  );
}

export default SignUp;
