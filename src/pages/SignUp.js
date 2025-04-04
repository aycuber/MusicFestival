import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CircularProgress
} from '@mui/material';
import { auth, db, googleProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // ----- Sign Up with email/password -----
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

  // ----- Sign Up with Google -----
  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user doc already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If not, create a new doc
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          username: user.displayName || '', // or generate a placeholder
          email: user.email,
          friends: [],
          bio: '',
          profilePicture: user.photoURL || '',
        });
      }

      navigate('/home');
    } catch (err) {
      setError(err.message);
      console.error('Google Sign Up error:', err);
    } finally {
      setLoading(false);
    }
  };
/**Creates the component that contains smaller components for the create your account */
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

      {/* Username Field */}
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {/* Email Field */}
      <TextField
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Password Field */}
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        sx={{ mb: 2 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Email/Password Sign Up */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ fontWeight: 'bold', py: 1.5, mb: 2 }}
        onClick={handleSignUp}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign Up'}
      </Button>

      {/* Sign Up with Google */}
      <Button
        variant="outlined"
        color="primary"
        fullWidth
        sx={{ fontWeight: 'bold', py: 1.5, mb: 2 }}
        onClick={handleGoogleSignUp}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign Up with Google'}
      </Button>

      {/* Redirect to Login */}
      <Typography variant="body2" sx={{ mt: 2 }}>
        Already have an account?{' '}
        <Button
          variant="text"
          color="secondary"
          sx={{ fontWeight: 'bold', textTransform: 'none', p: 0 }}
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
      </Typography>
    </Container>
  );
}

export default SignUp;
