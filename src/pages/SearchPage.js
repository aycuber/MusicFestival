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
  Modal,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Slider
} from '@mui/material';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // For location input (city or zip)
  const [locationInput, setLocationInput] = useState('');
  const [showLocPopdown, setShowLocPopdown] = useState(false);
  const locRef = useRef(null);

  // Geolocation state
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [locating, setLocating] = useState(false);

  // Distance slider (in miles)
  const [distance, setDistance] = useState(10);

  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // API results
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // For event details modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [friendsAttending, setFriendsAttending] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  // --- Event Handlers ---

  // Allow pressing Enter on search fields to trigger search.
  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Show/hide popdown when focusing the location input
  const handleLocFocus = () => setShowLocPopdown(true);
  const handleLocBlur = () => {
    setTimeout(() => setShowLocPopdown(false), 200);
  };

  // If user uses current location, we get their latitude/longitude and indicate in the box.
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    setLocating(true);
    setLocationInput('Locating...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        // Instead of reverse geocoding, we simply fill the input with a checkmark indicator.
        setLocationInput('Using Current Location ✓');
      },
      (err) => {
        setLocating(false);
        console.error('Geolocation error:', err);
        alert('Unable to get current location.');
        setLocationInput('');
      }
    );
  };

  const handleLocationChange = (e) => {
    setLocationInput(e.target.value);
    // If the user starts typing, remove previously fetched location.
    setUserLat(null);
    setUserLng(null);
  };

  // Slider is enabled only if the user has provided a location or used current location.
  const sliderDisabled = !locationInput && userLat === null;

  const handleDistanceChange = (e, newValue) => {
    setDistance(newValue);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Construct the date range parameters if provided.
      let startDateTime, endDateTime;
      if (startDate) {
        startDateTime = `${startDate}T00:00:00Z`;
      }
      if (endDate) {
        endDateTime = `${endDate}T23:59:59Z`;
      }

      // Build the query parameters for Ticketmaster.
      const params = {
        apikey: TICKETMASTER_API_KEY,
        keyword: searchQuery,
        classificationName: 'music',
        size: 20,
        startDateTime: startDateTime || undefined,
        endDateTime: endDateTime || undefined,
      };

      // Use lat/long if available (and if the location input indicates current location).
      if (userLat !== null && userLng !== null && locationInput.includes('Using Current Location')) {
        params.latlong = `${userLat},${userLng}`;
        if (distance > 0) {
          params.radius = distance;
        }
      } else if (locationInput) {
        // If the user typed a location.
        let isZip = /^\d{5}$/.test(locationInput.trim());
        if (isZip) {
          params.postalCode = locationInput.trim();
          if (distance > 0) {
            params.radius = distance;
          }
        } else {
          params.city = locationInput.trim();
          if (distance > 0) {
            params.radius = distance;
          }
        }
      }

      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params,
      });

      let eventsData =
        response.data._embedded?.events.map((event) => ({
          id: event.id,
          name: event.name,
          image:
            event.images.find((img) => img.ratio === '16_9')?.url ||
            'https://via.placeholder.com/300',
          date: event.dates?.start?.localDate || 'Date not available',
          venue: event._embedded?.venues?.[0]?.name || 'Venue not available',
          url: event.url,
        })) || [];

      // Deduplicate based on event.id
      const uniqueMap = new Map();
      for (const evt of eventsData) {
        if (!uniqueMap.has(evt.id)) {
          uniqueMap.set(evt.id, evt);
        }
      }
      const finalEvents = Array.from(uniqueMap.values());
      setEvents(finalEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event) => {
    setSelectedEvent(event);
    // Example data; in production, fetch real friend and group data.
    setFriendsAttending(['Alex', 'Jamie', 'Taylor']);
    setPublicGroups([
      { name: 'Festival Lovers', members: 34 },
      { name: 'EDM Squad', members: 18 },
    ]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  // Renders the event cards or a "No events found." message.
  const renderEvents = () => {
    if (events.length === 0 && !loading) {
      return (
        <Typography variant="h6" sx={{ color: 'text.primary', mt: 2 }}>
          No events found.
        </Typography>
      );
    }
    return (
      <Grid container spacing={3}>
        <TransitionGroup component={null}>
          {events.map((event) => (
            <CSSTransition key={event.id} classNames="card" timeout={400}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  onClick={() => handleOpenModal(event)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: '#1E1E1E', // dark base
                    border: '2px solid transparent',
                    borderRadius: 2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    position: 'relative',
                    height: 300, // fixed height for consistency
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
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={event.image}
                    alt={event.name}
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                      {event.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {event.date} - {event.venue}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </Grid>
    );
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}
      >
        Find Music Events
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Search
        </Typography>

        {/* Main text search field */}
        <TextField
          fullWidth
          label="Search by artist, event, or venue"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDownSearch}
          sx={{ mb: 2 }}
        />

        {/* Location & Distance side by side */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="City or Zip Code"
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
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    zIndex: 999,
                    mt: 0.5,
                    width: locRef.current?.offsetWidth || 200,
                  }}
                >
                  <Button
                    variant="text"
                    onClick={handleUseCurrentLocation}
                    sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                  >
                    Use Current Location
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                pointerEvents: !locationInput && userLat === null ? 'none' : 'auto',
                opacity: !locationInput && userLat === null ? 0.5 : 1,
              }}
            >
              <Typography variant="body2" gutterBottom>
                Search Distance (Miles): {distance}
              </Typography>
              <Slider
                value={distance}
                onChange={(e, val) => setDistance(val)}
                step={5}
                min={5}
                max={100}
                disabled={!locationInput && userLat === null}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Date fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
              onKeyDown={handleKeyDownSearch}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          sx={{ fontWeight: 'bold', mt: 2 }}
        >
          {locating ? <CircularProgress size={20} color="inherit" /> : 'Search'}
        </Button>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        // Render events or a "No events found" message.
        events.length === 0 ? (
          <Typography variant="h6" sx={{ color: 'text.primary', mt: 2 }}>
            No events found.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            <TransitionGroup component={null}>
              {events.map((event) => (
                <CSSTransition key={event.id} classNames="card" timeout={400}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      onClick={() => handleOpenModal(event)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: '#1E1E1E',
                        border: '2px solid transparent',
                        borderRadius: 2,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
                        overflow: 'hidden',
                        position: 'relative',
                        height: 300,
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
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="140"
                        image={event.image}
                        alt={event.name}
                        sx={{
                          borderBottom: '1px solid rgba(255,255,255,0.2)',
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent sx={{ pt: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1, textAlign: 'left' }}>
                          {event.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', textAlign: 'left' }}>
                          {event.date} - {event.venue}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </Grid>
        )
      )}

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            padding: 3,
            borderRadius: 2,
            width: '90%',
            maxWidth: 500,
            outline: 'none',
          }}
        >
          {selectedEvent && (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedEvent.name}
              </Typography>
              <Typography variant="body1">
                Date: {selectedEvent.date}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Venue: {selectedEvent.venue}
              </Typography>

              <Button
                variant="contained"
                color="primary"
                href={selectedEvent.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mb: 2 }}
              >
                Get Tickets
              </Button>

              <Typography variant="h6" gutterBottom>
                Friends Attending:
              </Typography>
              <List>
                {friendsAttending.map((friend, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={friend} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>
                Public Groups:
              </Typography>
              <List>
                {publicGroups.map((group, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${group.name} (${group.members} members)`} />
                    <Button variant="outlined" color="primary" sx={{ ml: 1 }}>
                      Join
                    </Button>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
}

export default SearchPage;
