import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, Checkbox, FormControlLabel, CircularProgress, Avatar } from '@mui/material';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const genres = ['EDM', 'Techno', 'Pop', 'Rock', 'Hip-Hop', 'Jazz'];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };
  
  

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setBio(userData.bio || '');
          setSelectedGenres(userData.genres || []);
          setProfilePictureUrl(userData.profilePicture || '');
        }
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, []);

  const handleGenreChange = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      let newProfilePictureUrl = profilePictureUrl;

      // Upload new profile picture to Firebase Storage if selected
      if (profilePicture) {
        const fileRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(fileRef, profilePicture);
        newProfilePictureUrl = await getDownloadURL(fileRef);
        setProfilePictureUrl(newProfilePictureUrl);
      }

      // Update user data in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        username,
        bio,
        genres: selectedGenres,
        profilePicture: newProfilePictureUrl,
      });

      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Your Profile
      </Typography>
      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            src={profilePictureUrl}
            sx={{ width: 100, height: 100 }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Upload New Profile Picture
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </Box>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Choose Your Music Taste
        </Typography>
        <Box sx={{ mb: 2 }}>
          {genres.map((genre) => (
            <FormControlLabel
              key={genre}
              control={
                <Checkbox
                  checked={selectedGenres.includes(genre)}
                  onChange={() => handleGenreChange(genre)}
                />
              }
              label={genre}
            />
          ))}
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
        <Button variant="contained" color="primary" onClick={handleLogout}>
            Log Out
        </Button>
      </form>
    </Container>
  );
}

export default ProfilePage;