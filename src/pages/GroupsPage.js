// src/pages/GroupsPage.js

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TICKETMASTER_API_KEY = 'YOUR_TICKETMASTER_API_KEY';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Create‑group dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Event search in dialog
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventSearchResults, setEventSearchResults] = useState([]);
  const [searchingEvents, setSearchingEvents] = useState(false);
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoadingGroups(true);
    try {
      const colRef = collection(db, 'groups');
      let all = [];

      // 1) public groups
      const pubSnap = await getDocs(query(colRef, where('isPublic', '==', true)));
      all.push(...pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (user) {
        // 2a) groups where I'm member
        const memSnap = await getDocs(query(colRef, where('members', 'array-contains', user.uid)));
        all.push(...memSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        // 2b) groups I own
        const ownSnap = await getDocs(query(colRef, where('ownerId', '==', user.uid)));
        all.push(...ownSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      // dedupe by id
      const map = new Map();
      all.forEach(g => map.set(g.id, g));
      setGroups(Array.from(map.values()));
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }

  // filter by name, desc, event
  const filtered = groups.filter(g => {
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      (g.eventName?.toLowerCase().includes(q)) ||
      (g.eventId?.toLowerCase().includes(q))
    );
  });

  // CREATE GROUP handlers
  function openCreate() {
    setCreateDialogOpen(true);
  }
  function closeCreate() {
    setCreateDialogOpen(false);
    setGroupName('');
    setGroupDesc('');
    setIsPublic(true);
    setEventSearchQuery('');
    setEventSearchResults([]);
    setEventId('');
    setEventName('');
  }
  async function createGroup() {
    if (!user) return alert('Log in to create a group');
    if (!eventId) return alert('Please select an event');
    try {
      await addDoc(collection(db, 'groups'), {
        name: groupName,
        description: groupDesc,
        isPublic,
        eventId,
        eventName,
        ownerId: user.uid,
        members: [user.uid],
        pendingRequests: []
      });
      closeCreate();
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Error creating group');
    }
  }

  // EVENT SEARCH in create dialog
  async function searchEvents() {
    if (!eventSearchQuery.trim()) return;
    setSearchingEvents(true);
    try {
      const resp = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: eventSearchQuery,
          classificationName: 'music',
          size: 5,
        },
      });
      const evs = resp.data._embedded?.events || [];
      setEventSearchResults(evs.map(ev => ({ id: ev.id, name: ev.name })));
    } catch (err) {
      console.error(err);
      alert('Event search failed');
    } finally {
      setSearchingEvents(false);
    }
  }

  // JOIN/REQUEST handlers
  async function joinOrRequest(grp) {
    if (!user) return alert('Log in first');
    const ref = doc(db, 'groups', grp.id);
    try {
      if (grp.isPublic) {
        await updateDoc(ref, { members: arrayUnion(user.uid) });
        alert(`Joined ${grp.name}`);
      } else {
        await updateDoc(ref, { pendingRequests: arrayUnion(user.uid) });
        alert(`Requested to join ${grp.name}`);
      }
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Could not join/request');
    }
  }

  // OWNER management
  async function accept(grp, uid) {
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, {
        pendingRequests: arrayRemove(uid),
        members: arrayUnion(uid),
      });
      fetchGroups();
    } catch (err) { console.error(err); alert('Error'); }
  }
  async function deny(grp, uid) {
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, { pendingRequests: arrayRemove(uid) });
      fetchGroups();
    } catch (err) { console.error(err); alert('Error'); }
  }
  async function kick(grp, uid) {
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, { members: arrayRemove(uid) });
      fetchGroups();
    } catch (err) { console.error(err); alert('Error'); }
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Groups
      </Typography>

      {/* Create + Search */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={openCreate}>
          Create New Group
        </Button>
        <TextField
          label="Search Groups or Events"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </Box>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={closeCreate}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={groupDesc}
            onChange={e => setGroupDesc(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Search an event"
              value={eventSearchQuery}
              onChange={e => setEventSearchQuery(e.target.value)}
            />
            <Button onClick={searchEvents} sx={{ mt: 1 }}>
              {searchingEvents ? <CircularProgress size={20} /> : 'Search'}
            </Button>

            <List dense sx={{ maxHeight: 150, overflowY: 'auto', mt: 1 }}>
              {eventSearchResults.map(ev => (
                <ListItem
                  button
                  key={ev.id}
                  onClick={() => {
                    setEventId(ev.id);
                    setEventName(ev.name);
                    setEventSearchResults([]);
                    setEventSearchQuery(ev.name);
                  }}
                >
                  <ListItemText primary={ev.name} secondary={ev.id} />
                </ListItem>
              ))}
            </List>

            {eventName && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Chosen Event: {eventName}
              </Typography>
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
            }
            label="Public Group?"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={createGroup}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group List */}
      {loadingGroups ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ p: 2 }}>
          {filtered.length === 0 ? (
            <Typography>No groups found.</Typography>
          ) : (
            filtered.map(grp => {
              const isOwner = user?.uid === grp.ownerId;
              const isMember = user && grp.members.includes(user.uid);

              return (
                <Box
                  key={grp.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: '#333',
                    color: '#fff',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h6">
                    {grp.name} {grp.isPublic ? '(Public)' : '(Private)'}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>{grp.description}</Typography>
                  {grp.eventName && (
                    <Typography sx={{ mb: 1 }}>Event: {grp.eventName}</Typography>
                  )}

                  {/* always show members */}
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Members ({grp.members.length}): {grp.members.join(', ')}
                  </Typography>

                  {/* owner controls */}
                  {isOwner && grp.pendingRequests.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight="bold">Pending:</Typography>
                      {grp.pendingRequests.map(uid => (
                        <Box key={uid} sx={{ display: 'flex', gap: 1, my: 0.5 }}>
                          <Typography>{uid}</Typography>
                          <Button size="small" onClick={() => accept(grp, uid)}>
                            Accept
                          </Button>
                          <Button size="small" onClick={() => deny(grp, uid)}>
                            Deny
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {isOwner && (
                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight="bold">Kick:</Typography>
                      {grp.members
                        .filter(m => m !== grp.ownerId)
                        .map(mUid => (
                          <Box key={mUid} sx={{ display: 'flex', gap: 1, my: 0.5 }}>
                            <Typography>{mUid}</Typography>
                            <Button size="small" onClick={() => kick(grp, mUid)}>
                              Kick
                            </Button>
                          </Box>
                        ))}
                    </Box>
                  )}

                  {/* join/request */}
                  {!isMember && user?.uid !== grp.ownerId && (
                    <Button
                      variant="contained"
                      onClick={() => joinOrRequest(grp)}
                      sx={{ mr: 1 }}
                    >
                      {grp.isPublic ? 'Join' : 'Request'}
                    </Button>
                  )}

                  {/* navigate to messaging page for this group */}
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/messaging/group_${grp.id}`)}
                  >
                    Open Group Chat
                  </Button>
                </Box>
              );
            })
          )}
        </Paper>
      )}
    </Container>
  );
}
