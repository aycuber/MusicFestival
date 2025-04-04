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
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  // Spotify config
  const SPOTIFY_CLIENT_ID = '5ef1cdc91da84a8693c3f9c810556d01';
  const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/account-setup';
  const SPOTIFY_SCOPES = ['user-top-read', 'playlist-read-private'];

  // STATE
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedSubGenres, setSelectedSubGenres] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ========== Load existing user data (username, subgenres, etc.) ==========
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setBio(userData.bio || '');
          setSelectedGenres(userData.genres || []);
          setSelectedSubGenres(userData.subGenres || {});
          if (userData.profilePicture) {
            setLocalPreviewUrl(userData.profilePicture);
          }
          if (userData.spotifyAccessToken) {
            setSpotifyAccessToken(userData.spotifyAccessToken);
          }
        }
      } catch (err) {
        setError('Failed to load existing account data');
      }
    };

    loadUserData();
  }, []);

  // ========== Parse Spotify token from URL ==========
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      const token = hashParams.get('access_token');
      if (token) {
        setSpotifyAccessToken(token);
        saveSpotifyToken(token);
        // Clean up hash
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // ========== Save Spotify Token to Firestore ==========
  const saveSpotifyToken = async (token) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        spotifyAccessToken: token
      });
    } catch (err) {
      console.error('Error saving Spotify token in AccountSetup:', err);
    }
  };

  // ========== Spotify Connect ==========
  const handleConnectSpotify = () => {
    const scopesParam = encodeURIComponent(SPOTIFY_SCOPES.join(' '));
    const redirectParam = encodeURIComponent(SPOTIFY_REDIRECT_URI);

    const authUrl = `https://accounts.spotify.com/authorize` +
      `?client_id=${SPOTIFY_CLIENT_ID}` +
      `&response_type=token` +
      `&redirect_uri=${redirectParam}` +
      `&scope=${scopesParam}` +
      `&show_dialog=true`;

    window.location.href = authUrl;
  };

  // ========== Genre Handlers ==========
  const handleGenreChange = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      setSelectedSubGenres((prev) => ({ ...prev, [genre]: [] }));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubGenreChange = (genre, subGenre) => {
    const current = selectedSubGenres[genre] || [];
    if (current.includes(subGenre)) {
      setSelectedSubGenres({
        ...selectedSubGenres,
        [genre]: current.filter((sg) => sg !== subGenre)
      });
    } else {
      setSelectedSubGenres({
        ...selectedSubGenres,
        [genre]: [...current, subGenre]
      });
    }
  };

  // ========== Avatar / File Input ==========
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setLocalPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ========== Submit / Save Account Setup ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is logged in');

      // --- Username Uniqueness Check ---
      // We'll check if *any* other user doc has the same username (besides current user's doc).
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnap = await getDocs(q);

      // If there's a doc, and it's not this user, that's a problem
      if (!querySnap.empty) {
        // The user might see themselves if they've saved a username already.
        // So let's see if there's a doc that doesn't match the current user ID:
        const conflict = querySnap.docs.find((docu) => docu.id !== user.uid);
        if (conflict) {
          throw new Error('Username already taken. Please choose another.');
        }
      }

      // --- Upload new profile picture if needed ---
      let finalPictureUrl = localPreviewUrl;
      if (profilePicture) {
        const fileRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(fileRef, profilePicture);
        finalPictureUrl = await getDownloadURL(fileRef);
      }

      // --- Save/Update Firestore ---
      await setDoc(
        doc(db, 'users', user.uid),
        {
          username,
          bio,
          genres: selectedGenres,
          subGenres: selectedSubGenres,
          profilePicture: finalPictureUrl,
          spotifyAccessToken
        },
        { merge: true }
      );

      // Go to home
      navigate('/home');
    } catch (err) {
      setError(err.message);
      console.error('AccountSetup error:', err);
    } finally {
      setUploading(false);
    }
  };

  // ========== RENDER ==========
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
        {/* USERNAME */}
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        {/* BIO */}
        <TextField
          fullWidth
          label="Bio"
          multiline
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* GENRES & SUBGENRES */}
        <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
          Choose Your EDM Subgenres
        </Typography>
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
            <Box sx={{ pl: 4 }}>
              {edmGenres[mainGenre].map((sub) => (
                <FormControlLabel
                  key={sub}
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        selectedSubGenres[mainGenre]?.includes(sub) || false
                      }
                      onChange={() => handleSubGenreChange(mainGenre, sub)}
                    />
                  }
                  label={sub}
                />
              ))}
            </Box>
          </Box>
        ))}

        {/* PROFILE PICTURE */}
        <Typography variant="h6" sx={{ mt: 2 }}>
          Profile Picture
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Avatar preview */}
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              '&:hover .overlay': { opacity: 0.3 },
            }}
            onClick={handleAvatarClick}
          >
            <Avatar
              src={localPreviewUrl}
              sx={{ width: 80, height: 80 }}
            />
            <Box
              className="overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '80px',
                height: '80px',
                backgroundColor: '#000',
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff'
              }}
            >
              <CameraAltIcon />
            </Box>
          </Box>
        </Box>

        {/* SPOTIFY CONNECT */}
        {!spotifyAccessToken && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleConnectSpotify}
              sx={{ mr: 2 }}
            >
              Connect Spotify
            </Button>
          </Box>
        )}
        {spotifyAccessToken && (
          <Typography variant="body2" sx={{ color: 'green', mb: 2 }}>
            Spotify connected!
          </Typography>
        )}

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
