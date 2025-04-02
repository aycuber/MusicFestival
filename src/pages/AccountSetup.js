import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** EDM subgenres (top-level + sub-subgenres optional).
 *  For a simpler initial setup, this example uses a limited list.
 */
const edmGenres = {
  Trance: ['Progressive Trance', 'Vocal Trance', 'Uplifting Trance'],
  House: ['Progressive House', 'Deep House', 'Tech House'],
  Techno: ['Detroit Techno', 'Minimal Techno', 'Melodic Techno'],
  Dubstep: ['Brostep', 'Melodic Dubstep', 'Riddim'],
  'Drum & Bass': ['Liquid DnB', 'Jump Up', 'Neurofunk'],
  Hardstyle: ['Euphoric Hardstyle', 'Rawstyle'],
  Electro: ['Electro Pop', 'Complextro'],
  'Future Bass': [],
  Trap: ['Hybrid Trap', 'Festival Trap']
};
/**This is just the setup for the profile page */

function AccountSetup() {
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Track whether user connected to Spotify/Instagram
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);

  const navigate = useNavigate();

  // Handle subgenre selection
  const handleGenreChange = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Handle file input
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  // Simulated "Connect" functions
  // In a real app, you'd redirect to an OAuth flow, etc.
  const connectSpotify = () => {
    // Toggle for demo – real logic would involve OAuth
    setSpotifyConnected(true);
    alert('Spotify account connected (demo)!');
  };

  const connectInstagram = () => {
    setInstagramConnected(true);
    alert('Instagram account connected (demo)!');
  };

  // Save all data to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      // Upload profile picture to Firebase Storage if present
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
        spotifyConnected,
        instagramConnected
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
      <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
        Account Setup
      </Typography>

      {error && (
        <Typography variant="body1" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Choose Your EDM Subgenres
        </Typography>

        {/* Render top-level EDM subgenres + sub-subgenres */}
        {Object.keys(edmGenres).map((mainGenre) => (
          <Box key={mainGenre} sx={{ mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedGenres.includes(mainGenre)}
                  onChange={() => handleGenreChange(mainGenre)}
                />
              }
              label={mainGenre}
            />
            {/* Show sub-subgenres underneath */}
            <Box sx={{ pl: 4 }}>
              {edmGenres[mainGenre].map((subGenre) => (
                <FormControlLabel
                  key={subGenre}
                  control={
                    <Checkbox
                      checked={selectedGenres.includes(subGenre)}
                      onChange={() => handleGenreChange(subGenre)}
                    />
                  }
                  label={subGenre}
                />
              ))}
            </Box>
          </Box>
        ))}

        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Profile Picture */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Upload Profile Picture
          </Typography>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </Box>

        {/* Connect Buttons (demo placeholders) */}
        <Box sx={{ mb: 2 }}>
          {!spotifyConnected && (
            <Button variant="contained" color="secondary" onClick={connectSpotify} sx={{ mr: 2 }}>
              Connect Spotify
            </Button>
          )}
          {!instagramConnected && (
            <Button variant="contained" color="secondary" onClick={connectInstagram}>
              Connect Instagram
            </Button>
          )}
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
