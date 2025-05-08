import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Heart, Share2, Music, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { auth, db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';

const waveVariants = {
  animate: (i) => ({
    scaleY: [0.2, 1, 0.2],
    backgroundColor: [
      'rgba(126, 34, 206, 0.3)',
      'rgba(45, 212, 191, 0.3)',
      'rgba(126, 34, 206, 0.3)'
    ],
    transition: {
      duration: 1.5 + Math.random(),
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      delay: i * 0.1
    }
  })
};

export default function ExplorePage() {
  const [events, setEvents] = useState([]);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [seenEventIds, setSeenEventIds] = useState(new Set());

  const TM_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';
  const DEFAULT_RADIUS = 100;
  const MAX_EVENTS = 3;

  // Get user preferences
  useEffect(() => {
    const fetchPrefs = async () => {
      const user = auth.currentUser;
      let subs = [];
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const data = snap.data();
          if (data?.subGenres) {
            Object.values(data.subGenres).flat().forEach(s => subs.push(s));
            subs = Array.from(new Set(subs));
          }
        } catch (e) { console.error(e); }
      }
      if (!subs.length) subs = ['EDM', 'Electronic'];
      setPrefs(subs);
    };
    fetchPrefs();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        err => {
          console.log('Location not available:', err);
          setUserLocation(false); // Set to false to indicate location fetch attempt completed
        }
      );
    } else {
      setUserLocation(false);
    }
  }, []);

  const fetchEvents = async (isRefresh = false) => {
    try {
      setRefreshing(isRefresh);
      
      const baseParams = {
        apikey: TM_KEY,
        classificationName: 'Electronic',
        size: 100,
        sort: 'date,asc'
      };

      // Fetch both local and popular events
      const requests = [
        // Local events if we have location
        userLocation && axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
          params: {
            ...baseParams,
            latlong: `${userLocation.lat},${userLocation.lng}`,
            radius: DEFAULT_RADIUS
          }
        }),
        // Popular events based on user preferences
        ...prefs.map(pref => 
          axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: {
              ...baseParams,
              keyword: pref,
              sort: 'relevance,desc'
            }
          })
        )
      ].filter(Boolean);

      const responses = await Promise.all(requests);
      
      // Create a Map to store unique events by name (stricter deduplication)
      const eventMap = new Map();
      
      responses.forEach(res => {
        const events = res.data._embedded?.events || [];
        events.forEach(e => {
          // Create a unique key using both ID and normalized name
          const normalizedName = e.name.toLowerCase().trim();
          const key = `${e.id}-${normalizedName}`;
          
          if (!eventMap.has(key)) {
            eventMap.set(key, {
              id: e.id,
              name: e.name,
              image: e.images.find(i => i.ratio === '16_9')?.url || e.images[0]?.url,
              date: e.dates?.start?.localDate,
              city: e._embedded?.venues?.[0]?.city?.name || '',
              state: e._embedded?.venues?.[0]?.state?.stateCode || '',
              venue: e._embedded?.venues?.[0]?.name || '',
              artist: e._embedded?.attractions?.[0]?.name || '',
              url: e.url,
              price: e.priceRanges?.[0]?.min ? `$${e.priceRanges[0].min}` : 'TBA',
              genre: e.classifications?.[0]?.genre?.name || 'Electronic',
              rank: calculateEventRank(e, userLocation)
            });
          }
        });
      });

      // Convert Map to array and filter out seen events
      let availableEvents = Array.from(eventMap.values())
        .filter(event => !seenEventIds.has(event.id));
      
      // If we don't have enough new events, reset seen events
      if (availableEvents.length < MAX_EVENTS) {
        setSeenEventIds(new Set());
        availableEvents = Array.from(eventMap.values());
      }

      // Sort by rank and take top MAX_EVENTS
      const selectedEvents = availableEvents
        .sort((a, b) => b.rank - a.rank)
        .slice(0, MAX_EVENTS);

      // Update seen events
      setSeenEventIds(prev => {
        const newSet = new Set(prev);
        selectedEvents.forEach(event => newSet.add(event.id));
        return newSet;
      });

      setEvents(selectedEvents);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate event rank based on multiple factors
  const calculateEventRank = (event, userLocation) => {
    let rank = 0;

    // Popularity indicators
    rank += event.rank || 0;
    rank += event.totalTickets ? Math.min(event.totalTickets / 1000, 10) : 0;
    
    // Date proximity (prefer upcoming events)
    const eventDate = new Date(event.dates?.start?.localDate);
    const daysDiff = (eventDate - new Date()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0 && daysDiff < 30) rank += 5;
    
    // Location proximity if available
    if (userLocation && event._embedded?.venues?.[0]?.location) {
      const venue = event._embedded.venues[0].location;
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(venue.latitude),
        parseFloat(venue.longitude)
      );
      rank += Math.max(0, 10 - distance / 50); // Higher rank for closer events
    }

    // Preference matching
    const eventGenres = [
      event.classifications?.[0]?.genre?.name,
      event.classifications?.[0]?.subGenre?.name,
      event.classifications?.[0]?.segment?.name
    ].filter(Boolean).map(g => g.toLowerCase());

    prefs?.forEach(pref => {
      if (eventGenres.some(g => g.includes(pref.toLowerCase()))) {
        rank += 3;
      }
    });

    return rank;
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Only fetch events when we have both prefs and attempted location fetch
  useEffect(() => {
    if (prefs !== null && userLocation !== null) {
      fetchEvents();
    }
  }, [prefs, userLocation]);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchEvents(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background waves */}
      <div className="fixed inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={waveVariants}
            animate="animate"
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${5 + i * 5}%`,
              width: '4px',
              height: '60%',
              borderRadius: '4px 4px 0 0'
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <section className="container mx-auto px-4 pt-12 pb-6">
          <div className="flex justify-between items-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold neon-glow"
            >
              Discover Events
            </motion.h1>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="btn-outline flex items-center gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </section>

        {/* Events Grid */}
        <section className="container mx-auto px-4 py-8">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400">No events found. Try refreshing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="wait">
                {events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
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