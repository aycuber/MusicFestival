import React, { useState } from 'react';
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

// For demonstration, we have a few locations
const locations = ['Los Angeles', 'New York', 'San Francisco', 'Chicago', 'Miami'];

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [friendsAttending, setFriendsAttending] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true); // Start loading spinner
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: searchQuery,
          classificationName: 'music',
          city: selectedLocation || undefined,
          startDateTime: selectedDate ? `${selectedDate}T00:00:00Z` : undefined,
          size: 20,
        },
      });

      let eventsData = response.data._embedded?.events.map((event) => ({
        id: event.id,
        name: event.name,
        image:
          event.images.find((img) => img.ratio === '16_9')?.url ||
          'https://via.placeholder.com/300',
        date: event.dates?.start?.localDate || 'Date not available',
        venue: event._embedded?.venues?.[0]?.name || 'Venue not available',
        url: event.url,
      })) || [];

      // Deduplicate by event ID
      const uniqueMap = new Map();
      for (const evt of eventsData) {
        if (!uniqueMap.has(evt.id)) {
          uniqueMap.set(evt.id, evt);
        }
      }
      const uniqueEvents = Array.from(uniqueMap.values());

      setEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const handleOpenModal = (event) => {
    setSelectedEvent(event);

    // Example data (replace with real backend calls)
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

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}
      >
        Search Music Events
      </Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Filters
        </Typography>
        <TextField
          fullWidth
          label="Search by name or location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Location Filter */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Date Filter */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Grid>

          {/* Artist Filter */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Artist"
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          sx={{ fontWeight: 'bold' }}
        >
          Search
        </Button>
      </Paper>

      {loading ? (
        // Show a loading spinner
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        // Animated list of events
        <Grid container spacing={3}>
          <TransitionGroup component={null}>
            {events.map((event) => (
              <CSSTransition
                key={event.id}
                classNames="card"
                timeout={400}
              >
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    onClick={() => handleOpenModal(event)}
                    sx={{
                      cursor: 'pointer',
                      // Purple/pink gradient background
                      background: 'linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)',
                      color: '#fff',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={event.image}
                      alt={event.name}
                      sx={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
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
      )}

      {/* Event Details Modal */}
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
                    <ListItemText
                      primary={`${group.name} (${group.members} members)`}
                    />
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
