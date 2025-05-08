import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Heart, Share2, Music, Search as SearchIcon } from 'lucide-react';
import axios from 'axios';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showLocPopdown, setShowLocPopdown] = useState(false);
  const locRef = useRef(null);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [locating, setLocating] = useState(false);
  const [distance, setDistance] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSearch = async () => {
    setLoading(true);
    try {
      let startDateTime = startDate ? `${startDate}T00:00:00Z` : undefined;
      let endDateTime = endDate ? `${endDate}T23:59:59Z` : undefined;

      const params = {
        apikey: TICKETMASTER_API_KEY,
        keyword: searchQuery,
        classificationName: 'Electronic',
        size: 100, // Fetch more to filter
        startDateTime,
        endDateTime,
      };

      if (userLat !== null && userLng !== null && locationInput.includes('Using Current Location')) {
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
        image: evt.images.find(i => i.ratio === '16_9')?.url || evt.images[0]?.url,
        date: evt.dates?.start?.localDate,
        city: evt._embedded?.venues?.[0]?.city?.name || '',
        state: evt._embedded?.venues?.[0]?.state?.stateCode || '',
        venue: evt._embedded?.venues?.[0]?.name || '',
        artist: evt._embedded?.attractions?.[0]?.name || '',
        url: evt.url,
        price: evt.priceRanges?.[0]?.min ? `$${evt.priceRanges[0].min}` : 'TBA',
        genre: evt.classifications?.[0]?.genre?.name || 'Electronic'
      }));

      // Deduplicate and limit to 15 events
      const uniqueEvents = Array.from(
        new Map(mapped.map(e => [e.id, e])).values()
      ).slice(0, 15);

      setEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-slate-900/95"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-8 neon-glow">
              Search Events
            </h1>

            <div className="card p-6 space-y-6">
              {/* Search Input */}
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input pl-12"
                  placeholder="Search by artist, event, or venue"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Location */}
              <div className="relative">
                <input
                  type="text"
                  className="input"
                  placeholder="City or Zip Code"
                  value={locating ? 'Locating...' : locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onFocus={() => setShowLocPopdown(true)}
                  onBlur={() => setTimeout(() => setShowLocPopdown(false), 200)}
                  ref={locRef}
                />
                {showLocPopdown && !locating && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-outline py-1 px-3"
                    onClick={handleUseCurrentLocation}
                  >
                    Use Current Location
                  </button>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Search Button */}
              <button
                className="btn-primary w-full"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Events'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No events found. Try adjusting your search criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
}

const EventCard = ({ event }) => {
  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Check out ${event.name} featuring ${event.artist}!`,
        url: event.url
      });
    } else {
      navigator.clipboard.writeText(event.url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8 }}
      className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
      onClick={() => window.open(event.url, '_blank')}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${event.image})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Genre Tag */}
      <div className="absolute top-4 right-4 z-10">
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500 text-white">
          {event.genre}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h3 className="text-2xl font-bold mb-2 text-white">{event.name}</h3>
        <p className="text-lg text-teal-400 mb-4">{event.artist}</p>
        
        <div className="flex items-center gap-4 text-slate-300 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{event.city}{event.state ? `, ${event.state}` : ''}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Add to favorites logic
              }}
            >
              <Heart className="w-5 h-5" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xl font-bold text-teal-400">{event.price}</span>
        </div>
      </div>
    </motion.div>
  );
};