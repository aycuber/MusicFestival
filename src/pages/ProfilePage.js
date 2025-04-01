import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Avatar
} from '@mui/material';
import { CameraAlt as CameraAltIcon } from '@mui/icons-material';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  // ========== SPOTIFY CONFIG ==========
  // Replace with your actual redirect URI, as registered in Spotify developer dashboard:
  const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/spotify/callback';
  const SPOTIFY_CLIENT_ID = '5ef1cdc91da84a8693c3f9c810556d01';
  const SPOTIFY_SCOPES = [
    'user-top-read',
    'playlist-read-private'
    // add more if needed
  ];
  
  // ========== STATE ==========
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedSubGenres, setSelectedSubGenres] = useState({
    House: [],
    Techno: [],
    DnB: [],
    Dubstep: [],
    Trance: [],
    Hardstyle: [],
    Disco: [],
  });

  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Spotify tokens/data
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ========== GENRES & SUBGENRES DEFINITION ==========
  const genres = ['Techno', 'House', 'DnB', 'Trance', 'Dubstep', 'Hardstyle', 'Disco'];
  const subGenres = {
    House: ['Deep House', 'Tropical House', 'Progressive House', 'Electro House'],
    Techno: ['Industrial', 'Deep', 'Melodic', 'Ambient'],
    DnB: ['Liquid', 'Neuro', 'Jungle'],
    Dubstep: ['Brostep', 'Melodic', 'Chillstep', 'Drumstep'],
    Trance: ['Tech', 'Goa', 'Hard', 'Melodic'],
    Hardstyle: ['Rawstyle', 'Euphoric', 'Early Hardstyle'],
    Disco: ['Nu-Disco', 'Dance-Punk', 'Eurodisco', 'Italo'],
  };

  // ========== FETCH USER DATA ON LOAD ==========
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setBio(userData.bio || '');
          setSelectedGenres(userData.genres || []);
          setSelectedSubGenres(
            userData.subGenres || {
              House: [],
              Techno: [],
              DnB: [],
              Dubstep: [],
              Trance: [],
              Hardstyle: [],
              Disco: [],
            }
          );
          setProfilePictureUrl(userData.profilePicture || '');

          // If we already have a token, store it locally
          if (userData.spotifyAccessToken) {
            setSpotifyAccessToken(userData.spotifyAccessToken);
            fetchSpotifyData(userData.spotifyAccessToken);
          }
        }
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, []);

  // ========== SPOTIFY IMPLICIT GRANT FLOW HANDLER ==========
  // Listen for token in URL hash if user returned from Spotify
  useEffect(() => {
    if (window.location.hash) {
      // e.g. #access_token=xxx&token_type=Bearer&expires_in=3600
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        console.log('Got Spotify token from redirect:', accessToken);
        setSpotifyAccessToken(accessToken);
        saveSpotifyTokenToFirestore(accessToken);
        fetchSpotifyData(accessToken);

        // Clear the hash from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Save the token in Firestore so we know user is "connected"
  const saveSpotifyTokenToFirestore = async (token) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        spotifyAccessToken: token,
      });
    } catch (err) {
      console.error('Error saving token to Firestore:', err);
    }
  };

  // Actually fetch user data from Spotify
  const fetchSpotifyData = async (token) => {
    try {
      // Example: fetch top artists
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=3', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        console.error('Spotify API error:', data.error);
        return;
      }
      console.log('Spotify top artists data:', data);

      // We'll just store name of top 3 artists
      const topArtists = data.items ? data.items.map((item) => item.name) : [];
      setSpotifyData({ topArtists });
    } catch (error) {
      console.error('Error fetching Spotify data:', error);
    }
  };

  // If user not connected, we build an auth URL for the Implicit Grant Flow
  const handleConnectSpotify = () => {
    const scopesParam = SPOTIFY_SCOPES.join(' ');
    const redirectUri = encodeURIComponent(SPOTIFY_REDIRECT_URI);

    // Build the Spotify auth URL
    const authUrl = `https://accounts.spotify.com/authorize` +
      `?client_id=${SPOTIFY_CLIENT_ID}` +
      `&response_type=token` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${encodeURIComponent(scopesParam)}` +
      `&show_dialog=true`;

    // Redirect the browser to Spotify
    window.location.href = authUrl;
  };

  // ========== HANDLERS ==========
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const handleGenreChange = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      setSelectedSubGenres((prev) => ({ ...prev, [genre]: [] }));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubGenreChange = (genre, subgenre) => {
    const current = selectedSubGenres[genre] || [];
    if (current.includes(subgenre)) {
      setSelectedSubGenres({
        ...selectedSubGenres,
        [genre]: current.filter((sg) => sg !== subgenre),
      });
    } else {
      setSelectedSubGenres({
        ...selectedSubGenres,
        [genre]: [...current, subgenre],
      });
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewProfilePicture(file);
      const preview = URL.createObjectURL(file);
      setLocalPreviewUrl(preview);
    }
  };

  // ========== SAVE CHANGES (PROFILE) ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      let finalProfileUrl = profilePictureUrl;
      if (newProfilePicture) {
        const fileRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(fileRef, newProfilePicture);
        finalProfileUrl = await getDownloadURL(fileRef);
      }

      await updateDoc(doc(db, 'users', user.uid), {
        username,
        bio,
        genres: selectedGenres,
        subGenres: selectedSubGenres,
        profilePicture: finalProfileUrl,
      });

      setProfilePictureUrl(finalProfileUrl);
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setUploading(false);
      setNewProfilePicture(null);
      setLocalPreviewUrl('');
    }
  };

  // Decide which image to show for the Avatar
  const displayAvatar = localPreviewUrl || profilePictureUrl;

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
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Clickable avatar container */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            position: 'relative',
            cursor: 'pointer',
            width: 120,
            height: 120,
            margin: '0 auto',
            borderRadius: '50%',
            '&:hover .overlay': { opacity: 0.4 },
            '&:hover .icon': { opacity: 1 },
          }}
          onClick={handleAvatarClick}
        >
          <Avatar src={displayAvatar} sx={{ width: 120, height: 120 }} />
          {/* Dark overlay on hover */}
          <Box
            className="overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '120px',
              height: '120px',
              backgroundColor: '#000',
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              borderRadius: '50%',
            }}
          />
          {/* Camera icon on hover */}
          <Box
            className="icon"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <CameraAltIcon />
          </Box>
        </Box>

        {/* Username */}
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        {/* Bio */}
        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Genre + Subgenres */}
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Choose Your Music Taste
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {genres.map((genre) => {
            const label = genre === 'DnB' ? 'D&B' : genre;
            return (
              <Box key={genre}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                    />
                  }
                  label={<Typography variant="body1">{label}</Typography>}
                />
                {/* If the user selected this genre, show subgenres */}
                {selectedGenres.includes(genre) && subGenres[genre] && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', pl: 4, mt: 1 }}>
                    {subGenres[genre].map((sub) => (
                      <FormControlLabel
                        key={sub}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedSubGenres[genre]?.includes(sub)}
                            onChange={() => handleSubGenreChange(genre, sub)}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {sub}
                          </Typography>
                        }
                      />
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Spotify Connect or Data */}
        {!spotifyAccessToken && (
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" color="secondary" onClick={handleConnectSpotify}>
              Connect to Spotify
            </Button>
          </Box>
        )}
        {spotifyAccessToken && spotifyData && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mt: 2 }}>Your Top Spotify Artists:</Typography>
            {spotifyData.topArtists?.length ? (
              <ul>
                {spotifyData.topArtists.map((artist) => (
                  <li key={artist}>{artist}</li>
                ))}
              </ul>
            ) : (
              <Typography variant="body2">No top artist data found.</Typography>
            )}
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ fontWeight: 'bold', mb: 1 }}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>

        {/* Log Out */}
        <Button variant="contained" color="primary" onClick={handleLogout} fullWidth>
          Log Out
        </Button>
      </form>
    </Container>
  );
}

export default ProfilePage;
