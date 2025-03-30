import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Grid, Card, CardMedia, CardContent, Modal, List, ListItem, ListItemText, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

const genres = ['Pop', 'Rock', 'EDM', 'Hip-Hop', 'Jazz', 'Country', 'Classical'];
const locations = ['Los Angeles', 'New York', 'San Francisco', 'Chicago', 'Miami'];

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [friendsAttending, setFriendsAttending] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearch = async () => {
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: searchQuery,
          classificationName: 'music',
          genreId: selectedGenre || undefined,
          city: selectedLocation || undefined,
          startDateTime: selectedDate ? `${selectedDate}T00:00:00Z` : undefined,
          size: 20,
        },
      });

      const eventsData = response.data._embedded?.events.map(event => ({
        id: event.id,
        name: event.name,
        image: event.images.find(img => img.ratio === '16_9')?.url || 'https://via.placeholder.com/300',
        date: event.dates?.start?.localDate || 'Date not available',
        venue: event._embedded?.venues?.[0]?.name || 'Venue not available',
        url: event.url,
      })) || [];

      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleOpenModal = (event) => {
    setSelectedEvent(event);

    // Example data (replace with real backend call)
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
    <Container sx={{ mt: 4 }}>
      <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
          >
          Search Music Events
      </Typography>

      {/* Search Bar */}
      <TextField
        fullWidth
        label="Search by name, genre, or location"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Genre Filter */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Genre</InputLabel>
            <Select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {genres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Location Filter */}
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
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
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Search
      </Button>

      {/* Event Cards */}
      <Grid container spacing={3}>
        {events.map(event => (
          <Grid item key={event.id} xs={12} sm={6} md={4}>
            <Card onClick={() => handleOpenModal(event)} sx={{ cursor: 'pointer' }}>
              <CardMedia
                component="img"
                height="140"
                image={event.image}
                alt={event.name}
              />
              <CardContent>
                <Typography variant="h6">{event.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.date} - {event.venue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
