import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = 'your_spotify_client_id';  // Replace with your actual Spotify Client ID
const REDIRECT_URI = 'http://localhost:3000/callback'; // Replace with your actual redirect URI
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = ['user-read-private', 'user-read-email', 'playlist-read-private'];

function AccountSetup() {
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const navigate = useNavigate();

  const genres = ['EDM', 'Techno', 'Pop', 'Rock', 'Hip-Hop', 'Jazz'];

  const handleGenreChange = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save user preferences and navigate to home
    navigate('/home');
  };

  const connectToSpotify = () => {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Account Setup
      </Typography>
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
        {/* Spotify Connect Button */}
        <Button 
          variant="contained" 
          color="secondary" 
          fullWidth 
          onClick={connectToSpotify} 
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          Connect to my Spotify
        </Button>
        
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold' }}>
          Save and Continue
        </Button>
      </form>
    </Container>
  );
}

export default AccountSetup;