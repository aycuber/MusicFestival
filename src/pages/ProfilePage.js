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
  // ---- SPOTIFY CONFIG ----
  const SPOTIFY_CLIENT_ID = '5ef1cdc91da84a8693c3f9c810556d01';
  // Must match the redirect URI you set in Spotify's dashboard
  const SPOTIFY_REDIRECT_URI = 'http://yourtuneapp.com/profile';
  const SPOTIFY_SCOPES = ['user-top-read', 'playlist-read-private'];

  // ---- STATE ----
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

  // Profile picture states
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Spotify tokens/data
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ---- EDM GENRES DEFINITION ----
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

  // ---- FETCH USER DATA ON LOAD ----
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

          if (userData.spotifyAccessToken) {
            setSpotifyAccessToken(userData.spotifyAccessToken);
            // Optionally fetch Spotify data here if you want
          }
        }
      } catch (err) {
        setError('Failed to fetch user data');
      }
    };

    fetchUserData();
  }, []);

  // ---- PARSE TOKEN FROM URL HASH IF WE JUST CAME FROM SPOTIFY ----
  useEffect(() => {
    if (window.location.hash) {
      // e.g. #access_token=ABC123&token_type=Bearer&expires_in=3600
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const token = hashParams.get('access_token');
      if (token) {
        console.log('Got Spotify token from redirect:', token);
        setSpotifyAccessToken(token);
        saveSpotifyTokenToFirestore(token);

        // Remove the hash from the URL (clean up)
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ---- SAVE SPOTIFY TOKEN ----
  const saveSpotifyTokenToFirestore = async (token) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        spotifyAccessToken: token,
      });
      console.log('Spotify token stored in Firestore');
    } catch (err) {
      console.error('Error saving token to Firestore:', err);
    }
  };

  // ---- CONNECT SPOTIFY (IMPLICIT GRANT FLOW) ----
  const handleConnectSpotify = () => {
    const scopesParam = encodeURIComponent(SPOTIFY_SCOPES.join(' '));
    const redirectParam = encodeURIComponent(SPOTIFY_REDIRECT_URI);

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize` +
      `?client_id=${SPOTIFY_CLIENT_ID}` +
      `&response_type=token` +
      `&redirect_uri=${redirectParam}` +
      `&scope=${scopesParam}` +
      `&show_dialog=true`;

    // Redirect user to Spotify’s OAuth page
    window.location.href = spotifyAuthUrl;
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  // ---- GENRE/SUBGENRE HANDLERS ----
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

  // ---- AVATAR UPLOAD HANDLERS ----
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewProfilePicture(file);
      // local preview
      const preview = URL.createObjectURL(file);
      setLocalPreviewUrl(preview);
    }
  };

  // ---- SAVE PROFILE CHANGES ----
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

  // ---- Decide which image to show for the Avatar
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

        {/* Avatar */}
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
          {/* Hover overlay */}
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
          {/* Camera icon */}
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

        {/* If no Spotify token, show Connect button */}
        {!spotifyAccessToken && (
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" color="secondary" onClick={handleConnectSpotify}>
              Connect to Spotify
            </Button>
          </Box>
        )}

        {/* If needed, show some message that user is connected */}
        {spotifyAccessToken && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Spotify is connected!
            </Typography>
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
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          fullWidth
        >
          Log Out
        </Button>
      </form>
    </Container>
  );
}

export default ProfilePage;
