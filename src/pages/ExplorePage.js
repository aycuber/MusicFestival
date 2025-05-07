// src/pages/ExplorePage.js
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button
} from '@mui/material';
import axios from 'axios';
import { auth, db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { logInteraction } from '../utils/logInteractions';

export default function ExplorePage() {
  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular]         = useState([]);
  const [nearEvents, setNearEvents]   = useState([]);
  const [prefs, setPrefs]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [nearMeMode, setNearMeMode]   = useState(false);

  const TM_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';
  const DEFAULT_RADIUS = 25; // miles

  // 1) Load sub-genres or default to ['EDM']
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      let subs = [];
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const data = snap.data();
          if (data?.subGenres) {
            Object.values(data.subGenres)
              .flat()
              .forEach(s => subs.push(s));
            subs = Array.from(new Set(subs));
          }
        } catch (e) {
          console.error('Load prefs error', e);
        }
      }
      if (!subs.length) subs = ['EDM'];
      setPrefs(subs);
    })();
  }, []);

  // 2) Fetch recommended + popular when NOT in near-me mode
  useEffect(() => {
    if (nearMeMode || !prefs.length) return;
    setLoading(true);

    (async () => {
      try {
        // Recommended (first subgenre)
        const recResp = await axios.get(
          'https://app.ticketmaster.com/discovery/v2/events.json',
          {
            params: {
              apikey:             TM_KEY,
              classificationName: 'Electronic',
              keyword:            prefs[0],
              size:               20,
              sort:               'relevance,desc'
            }
          }
        );
        let recEv = recResp.data._embedded?.events || [];
        recEv = recEv.map(e => ({
          id:    e.id,
          name:  e.name,
          image: e.images.find(i => i.ratio === '16_9')?.url || e.images[0]?.url || '',
          date:  e.dates?.start?.localDate,
          venue: e._embedded?.venues?.[0]?.name || 'Unknown venue',
          url:   e.url
        }));
        const seenR = new Set();
        let recList = recEv.filter(e => {
          if (seenR.has(e.name)) return false;
          seenR.add(e.name);
          return true;
        }).slice(0, 6);

        // Popular pool (EDM)
        const popResp = await axios.get(
          'https://app.ticketmaster.com/discovery/v2/events.json',
          {
            params: {
              apikey:             TM_KEY,
              classificationName: 'Electronic',
              size:               35,
              sort:               'relevance,desc'
            }
          }
        );
        let popEv = popResp.data._embedded?.events || [];
        popEv = popEv.map(e => ({
          id:    e.id,
          name:  e.name,
          image: e.images.find(i => i.ratio === '16_9')?.url || e.images[0]?.url || '',
          date:  e.dates?.start?.localDate,
          venue: e._embedded?.venues?.[0]?.name || 'Unknown venue',
          url:   e.url
        }));
        const seenP = new Set();
        let popUnique = popEv.filter(e => {
          if (seenP.has(e.name)) return false;
          seenP.add(e.name);
          return true;
        });

        // Backfill recommended if fewer than 6
        if (recList.length < 6) {
          const deficit = 6 - recList.length;
          const fill = popUnique.slice(0, deficit);
          recList = [...recList, ...fill];
          popUnique = popUnique.slice(deficit);
        }

        // Next 9 popular
        let popList = popUnique.slice(0, 9);

        // Fallback if fewer than 9
        if (popList.length < 9) {
          const fbResp = await axios.get(
            'https://app.ticketmaster.com/discovery/v2/events.json',
            {
              params: {
                apikey:             TM_KEY,
                classificationName: 'Electronic',
                size:               9,
                sort:               'relevance,desc'
              }
            }
          );
          let fbEv = fbResp.data._embedded?.events || [];
          fbEv = fbEv.map(e => ({
            id:    e.id,
            name:  e.name,
            image: e.images.find(i => i.ratio === '16_9')?.url || e.images[0]?.url || '',
            date:  e.dates?.start?.localDate,
            venue: e._embedded?.venues?.[0]?.name || 'Unknown venue',
            url:   e.url
          }));
          const taken = new Set([
            ...recList.map(e => e.name),
            ...popList.map(e => e.name)
          ]);
          for (const e of fbEv) {
            if (popList.length === 9) break;
            if (!taken.has(e.name)) {
              popList.push(e);
              taken.add(e.name);
            }
          }
        }

        setRecommended(recList);
        setPopular(popList);
        setError(null);
      } catch (err) {
        console.error('Fetch events error:', err);
        setError(
          err.response?.status === 429
            ? 'Rate limit reached—please try again later.'
            : 'Failed to fetch events.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [prefs, nearMeMode]);

  // Handle “Only show events near me”
  const handleNearMe = () => {
    if (nearMeMode) {
      setNearMeMode(false);
      setError(null);
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await axios.get(
            'https://app.ticketmaster.com/discovery/v2/events.json',
            {
              params: {
                apikey:             TM_KEY,
                classificationName: 'Electronic',
                size:               15,
                sort:               'relevance,desc',
                latlong:            `${coords.latitude},${coords.longitude}`,
                radius:             DEFAULT_RADIUS
              }
            }
          );
          let ev = res.data._embedded?.events || [];
          ev = ev.map(e => ({
            id:    e.id,
            name:  e.name,
            image: e.images.find(i => i.ratio === '16_9')?.url || e.images[0]?.url || '',
            date:  e.dates?.start?.localDate,
            venue: e._embedded?.venues?.[0]?.name || 'Unknown venue',
            url:   e.url
          }));
          const seen = new Set();
          ev = ev.filter(e => {
            if (seen.has(e.name)) return false;
            seen.add(e.name);
            return true;
          }).slice(0, 15);

          setNearEvents(ev);
          setNearMeMode(true);
          setError(null);
        } catch (err) {
          console.error('Fetch near-me error:', err);
          setError(
            err.response?.status === 429
              ? 'Rate limit reached—please try again later.'
              : 'Failed to fetch nearby events.'
          );
        } finally {
          setLoading(false);
        }
      },
      geoErr => {
        console.error('Geo error:', geoErr);
        alert('Unable to get your location.');
        setLoading(false);
      }
    );
  };

  // Shared card styling—taller card
  const cardSx = {
    cursor: 'pointer',
    backgroundColor: '#1E1E1E',
    border: '2px solid transparent',
    borderRadius: 2,
    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    position: 'relative',
    height: 360,              // ↑ raised from 300
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'scale(1.04)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
    },
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '6px',
      background: 'linear-gradient(90deg, #9c27b0, #e91e63)',
    },
  };

  if (loading) {
    return (
      <Box sx={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'black'
      }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Explore Festivals
      </Typography>

      <Button
        variant="outlined"
        onClick={handleNearMe}
        sx={{ mb: 3 }}
      >
        {nearMeMode ? 'Show Recommendations' : 'Only show events near me'}
      </Button>

      {nearMeMode ? (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Events Near You
          </Typography>
          <Grid container spacing={3}>
            {nearEvents.map(evt => (
              <Grid key={evt.id} item xs={12} sm={6} md={4}>
                <Card
                  sx={cardSx}
                  onClick={() => {
                    logInteraction(evt.id, 3); //Logs the interaction and places a score on the interaction for certain festival event
                    window.open(evt.url, '_blank')
                }}
                >
                  <CardMedia
                    component="img"
                    height="200"       // ↑ raised from 140
                    image={evt.image}
                    alt={evt.name}
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1, textAlign: 'left' }}>
                      {evt.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', textAlign: 'left' }}>
                      {evt.date} — {evt.venue}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            We recommend you check out these events
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {recommended.map(evt => (
              <Grid key={evt.id} item xs={12} sm={6} md={4}>
                <Card
                  sx={cardSx}
                  onClick={() => window.open(evt.url, '_blank')}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={evt.image}
                    alt={evt.name}
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1, textAlign: 'left' }}>
                      {evt.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', textAlign: 'left' }}>
                      {evt.date} — {evt.venue}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Popular Events
          </Typography>
          <Grid container spacing={3}>
            {popular.map(evt => (
              <Grid key={evt.id} item xs={12} sm={6} md={4}>
                <Card
                  sx={cardSx}
                  onClick={() => window.open(evt.url, '_blank')}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={evt.image}
                    alt={evt.name}
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1, textAlign: 'left' }}>
                      {evt.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', textAlign: 'left' }}>
                      {evt.date} — {evt.venue}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}
