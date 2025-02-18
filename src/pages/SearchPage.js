import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    // Implement search logic here
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Search Festivals
      </Typography>
      <TextField
        fullWidth
        label="Search by name, genre, or location"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleSearch} sx={{ fontWeight: 'bold' }}>
        Search
      </Button>
    </Container>
  );
}

export default SearchPage;