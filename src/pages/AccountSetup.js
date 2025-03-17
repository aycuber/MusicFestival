import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AccountSetup() {
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const genres = ['EDM', 'Techno', 'Pop', 'Rock', 'Hip-Hop', 'Jazz'];

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

      // Upload profile picture to Firebase Storage
      let profilePictureUrl = '';
      if (profilePicture) {
        const fileRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(fileRef, profilePicture);
        profilePictureUrl = await getDownloadURL(fileRef);
      }

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        bio,
        genres: selectedGenres,
        profilePicture: profilePictureUrl,
      });

      navigate('/home'); // Redirect to home page after setup
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Account Setup
      </Typography>
      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit}>
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
        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Upload Profile Picture
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold' }}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Save and Continue'}
        </Button>
      </form>
    </Container>
  );
}

export default AccountSetup;