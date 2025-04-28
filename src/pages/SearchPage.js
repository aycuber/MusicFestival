// src/pages/SearchPage.js
import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Paper,
  CircularProgress,
  Slider
} from '@mui/material';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Location
  const [locationInput, setLocationInput] = useState('');
  const [showLocPopdown, setShowLocPopdown] = useState(false);
  const locRef = useRef(null);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [locating, setLocating] = useState(false);

  // Distance slider
  const [distance, setDistance] = useState(10);

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Results
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleKeyDownSearch = e => {
    if (e.key === 'Enter') handleSearch();
  };
  const handleLocFocus = () => setShowLocPopdown(true);
  const handleLocBlur = () => setTimeout(() => setShowLocPopdown(false), 200);
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setLocating(true);
    setLocationInput('Locating...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationInput('Using Current Location ✓');
      },
      err => {
        setLocating(false);
        console.error(err);
        alert('Unable to get location');
        setLocationInput('');
      }
    );
  };
  const handleLocationChange = e => {
    setLocationInput(e.target.value);
    setUserLat(null);
    setUserLng(null);
  };
  const handleDistanceChange = (e, val) => setDistance(val);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let startDateTime = startDate ? `${startDate}T00:00:00Z` : undefined;
      let endDateTime = endDate ? `${endDate}T23:59:59Z` : undefined;

      const params = {
        apikey: TICKETMASTER_API_KEY,
        keyword: searchQuery,
        classificationName: 'Electronic',
        size: 20,
        startDateTime,
        endDateTime,
      };

      if (
        userLat !== null &&
        userLng !== null &&
        locationInput.includes('Using Current Location')
      ) {
        params.latlong = `${userLat},${userLng}`;
        if (distance > 0) params.radius = distance;
      } else if (locationInput) {
        const isZip = /^\d{5}$/.test(locationInput.trim());
        if (isZip) {
          params.postalCode = locationInput.trim();
        } else {
          params.city = locationInput.trim();
        }
        if (distance > 0) params.radius = distance;
      }

      const resp = await axios.get(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        { params }
      );

      const raw = resp.data._embedded?.events || [];
      const mapped = raw.map(evt => ({
        id: evt.id,
        name: evt.name,
        image:
          evt.images.find(i => i.ratio === '16_9')?.url ||
          'https://via.placeholder.com/300',
        date: evt.dates?.start?.localDate || 'Date N/A',
        venue: evt._embedded?.venues?.[0]?.name || 'Venue N/A',
        url: evt.url,
      }));

      // Deduplicate by id
      const uniq = Array.from(new Map(mapped.map(e => [e.id, e])).values());
      setEvents(uniq);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'text.primary' }}
      >
        Find Music Events
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search
        </Typography>

        <TextField
          fullWidth
          label="Search by artist, event, or venue"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDownSearch}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="City or Zip"
                value={locating ? 'Locating...' : locationInput}
                onChange={handleLocationChange}
                onFocus={handleLocFocus}
                onBlur={handleLocBlur}
                inputRef={locRef}
                onKeyDown={handleKeyDownSearch}
              />
              {showLocPopdown && !locating && (
                <Box
                  sx={{
                    position: 'absolute',
                    bgcolor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 1,
                    zIndex: 10,
                    mt: 0.5,
                    width: locRef.current?.offsetWidth || 200,
                  }}
                >
                  <Button
                    variant="text"
                    onClick={handleUseCurrentLocation}
                    sx={{ textTransform: 'none' }}
                  >
                    Use Current Location
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Distance (miles): {distance}
            </Typography>
            <Slider
              value={distance}
              onChange={handleDistanceChange}
              step={5}
              min={5}
              max={100}
              disabled={!locationInput && userLat == null}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              onKeyDown={handleKeyDownSearch}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              onKeyDown={handleKeyDownSearch}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ fontWeight: 'bold' }}
        >
          {locating ? <CircularProgress size={20} /> : 'Search'}
        </Button>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Typography>No events found.</Typography>
      ) : (
        <Grid container spacing={3}>
          <TransitionGroup component={null}>
            {events.map(event => (
              <CSSTransition key={event.id} timeout={400} classNames="card">
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    onClick={() => window.open(event.url, '_blank')}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: '#1E1E1E',
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                      overflow: 'hidden',
                      position: 'relative',
                      height: 300,
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'scale(1.04)' },
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '6px',
                        background: 'linear-gradient(90deg, #9c27b0, #e91e63)',
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={event.image}
                      alt={event.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ pt: 1 }}>
                      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        {event.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {event.date} — {event.venue}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </Grid>
      )}
    </Container>
  );
}
