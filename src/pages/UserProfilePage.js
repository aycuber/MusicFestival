// src/pages/UserProfilePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Container,
  Typography,
  Avatar,
  CircularProgress,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

export default function UserProfilePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  // 1) fetch the user doc
  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    };
    fetchUser();
  }, [uid]);

  // 2) fetch groups this user belongs to
  useEffect(() => {
    const fetchGroups = async () => {
      const grpRef = collection(db, 'groups');
      const q = query(grpRef, where('members', 'array-contains', uid));
      const snap = await getDocs(q);
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchGroups();
  }, [uid]);

  if (loading) return <CircularProgress />;
  if (!userData) return <Typography>User not found.</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:3 }}>
        <Avatar
          src={userData.profilePicture}
          sx={{ width:80, height:80 }}
        />
        <Typography variant="h4">{userData.username}</Typography>
      </Box>

      {/* Bio */}
      <Typography variant="body1" sx={{ mb:3 }}>
        <strong>Bio:</strong> {userData.bio || 'No bio provided'}
      </Typography>

      {/* Groups */}
      <Typography variant="h6">Groups</Typography>
      {groups.length === 0 ? (
        <Typography>No groups to show.</Typography>
      ) : (
        <List>
          {groups.map(g => (
            <ListItem
              button
              key={g.id}
              onClick={() => navigate(`/messaging/group_${g.id}`)}
            >
              <ListItemText primary={g.name} />
            </ListItem>
          ))}
        </List>
      )}

      {/* Music Tastes (only subGenres) */}
      <Typography variant="h6" sx={{ mt:4 }}>Music Tastes</Typography>
      {userData.subGenres && Object.keys(userData.subGenres).length > 0 ? (
        <Box>
          {Object.entries(userData.subGenres).map(([parent, subs]) => (
            <Box key={parent} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb:1 }}>
                {parent}
              </Typography>
              <Box sx={{ display:'flex', flexWrap:'wrap', gap:1 }}>
                {(Array.isArray(subs) ? subs : []).map((s,i) => (
                  <Chip
                    key={i}
                    label={s}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography>No music tastes listed.</Typography>
      )}
    </Container>
  );
}
