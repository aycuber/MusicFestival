import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
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
  MenuItem
} from '@mui/material';
import { collection, doc, getDocs, query, where, updateDoc, addDoc,
  arrayUnion, arrayRemove, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase'; // adjust your firebase imports
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import axios from 'axios';

// For searching Ticketmaster
const TICKETMASTER_API_KEY = 'YOUR_TICKETMASTER_API_KEY';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Create Group Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // We'll store both eventId and eventName in the group doc,
  // so we can display/ search by event name too.
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');

  // For searching events from Ticketmaster in the dialog
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventSearchResults, setEventSearchResults] = useState([]);
  const [searchingEvents, setSearchingEvents] = useState(false);

  // The selected group for chatting
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Chat messages for the selected group
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  /**
   * 1) Fetch all public groups
   * 2) If user is logged in, also fetch groups they own or are a member of
   * 3) Merge them, deduplicate
   */
  const fetchGroups = async () => {
    setLoadingGroups(true);
    const user = auth.currentUser;
    try {
      const colRef = collection(db, 'groups');
      let finalList = [];

      // 1) Public
      const publicQ = query(colRef, where('isPublic', '==', true));
      const publicSnap = await getDocs(publicQ);
      const publicGroups = publicSnap.docs.map(ds => ({ id: ds.id, ...ds.data() }));
      finalList.push(...publicGroups);

      if (user) {
        // 2a) Groups where I'm a member
        const memberQ = query(colRef, where('members', 'array-contains', user.uid));
        const memberSnap = await getDocs(memberQ);
        const memberGroups = memberSnap.docs.map(ds => ({ id: ds.id, ...ds.data() }));
        finalList.push(...memberGroups);

        // 2b) Groups I own
        const ownerQ = query(colRef, where('ownerId', '==', user.uid));
        const ownerSnap = await getDocs(ownerQ);
        const ownerGroups = ownerSnap.docs.map(ds => ({ id: ds.id, ...ds.data() }));
        finalList.push(...ownerGroups);
      }

      // Deduplicate
      const dedupMap = new Map();
      finalList.forEach(g => dedupMap.set(g.id, g));
      const merged = Array.from(dedupMap.values());
      setGroups(merged);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Filter by name, desc, eventId, or eventName
  const filteredGroups = groups.filter(grp => {
    const q = searchQuery.toLowerCase();
    return (
      grp.name?.toLowerCase().includes(q) ||
      grp.description?.toLowerCase().includes(q) ||
      grp.eventId?.toLowerCase().includes(q) ||
      grp.eventName?.toLowerCase().includes(q)
    );
  });

  // ================= CREATE GROUP DIALOG =================
  const handleOpenCreate = () => setCreateDialogOpen(true);
  const handleCloseCreate = () => {
    setCreateDialogOpen(false);
    setGroupName('');
    setGroupDesc('');
    setIsPublic(true);
    setEventId('');
    setEventName('');
    setEventSearchQuery('');
    setEventSearchResults([]);
  };

  /**
   * Actually create the group doc in Firestore
   */
  const handleCreateGroup = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Must be logged in');
      return;
    }
    if (!eventId) {
      alert('Please select an event before creating the group.');
      return;
    }
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
      alert('Group created!');
      handleCloseCreate();
      fetchGroups();
    } catch (err) {
      console.error('Create group error:', err);
      alert('Error creating group');
    }
  };

  /**
   * Search events from Ticketmaster by name (for the create group dialog).
   * We'll do a minimal approach with the official API:
   */
  const handleSearchEvents = async () => {
    if (!eventSearchQuery.trim()) return;
    setSearchingEvents(true);
    try {
      const url = 'https://app.ticketmaster.com/discovery/v2/events.json';
      const resp = await axios.get(url, {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword: eventSearchQuery,
          classificationName: 'music',
          size: 5 // limit results to a small number
        }
      });
      const data = resp.data._embedded?.events || [];
      // We'll store an array of {id, name} for each event
      const results = data.map(ev => ({
        id: ev.id,
        name: ev.name
      }));
      setEventSearchResults(results);
    } catch (err) {
      console.error('Error searching events:', err);
      alert('Failed to search events. Check console.');
    } finally {
      setSearchingEvents(false);
    }
  };

  // The user picks an event from the search results => store eventId and eventName
  const handleSelectEvent = (ev) => {
    setEventId(ev.id);
    setEventName(ev.name);
    // Clear search results, or keep them, your choice
    setEventSearchResults([]);
    setEventSearchQuery(ev.name);
  };

  // user typed in search for groups
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Join or request membership
   */
  const handleJoinOrRequest = async (grp) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Must be logged in');
      return;
    }
    try {
      const ref = doc(db, 'groups', grp.id);
      if (grp.isPublic) {
        // join directly
        await updateDoc(ref, {
          members: arrayUnion(user.uid)
        });
        alert(`Joined ${grp.name}`);
      } else {
        // private => user is added to pendingRequests
        await updateDoc(ref, {
          pendingRequests: arrayUnion(user.uid)
        });
        alert(`Requested to join ${grp.name}`);
      }
      fetchGroups();
    } catch (err) {
      console.error('Error joining/requesting group', err);
      alert('Error joining/requesting group');
    }
  };

  /**
   * Accept or deny membership request (owner only)
   */
  const handleAcceptRequest = async (grp, requestUid) => {
    const user = auth.currentUser;
    if (!user || user.uid !== grp.ownerId) {
      alert('Not authorized');
      return;
    }
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, {
        pendingRequests: arrayRemove(requestUid),
        members: arrayUnion(requestUid)
      });
      alert('Accepted request!');
      fetchGroups();
    } catch (err) {
      console.error('Error accepting request', err);
      alert('Error accepting request');
    }
  };
  const handleDenyRequest = async (grp, requestUid) => {
    const user = auth.currentUser;
    if (!user || user.uid !== grp.ownerId) {
      alert('Not authorized');
      return;
    }
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, {
        pendingRequests: arrayRemove(requestUid)
      });
      alert('Denied request');
      fetchGroups();
    } catch (err) {
      console.error('Error denying request', err);
      alert('Error denying request');
    }
  };

  /**
   * Kick a user from the group (owner only)
   */
  const handleKickMember = async (grp, memberUid) => {
    const user = auth.currentUser;
    if (!user || user.uid !== grp.ownerId) {
      alert('Not authorized');
      return;
    }
    const ref = doc(db, 'groups', grp.id);
    try {
      await updateDoc(ref, {
        members: arrayRemove(memberUid)
      });
      alert('User kicked');
      fetchGroups();
    } catch (err) {
      console.error('Error kicking user', err);
      alert('Error kicking user');
    }
  };

  /**
   * Select a group => load chat messages real-time
   * We'll allow opening the chat if the group is public OR user is in members
   */
  const handleSelectGroup = (grp) => {
    const user = auth.currentUser;
    const isMember = user && grp.members?.includes(user.uid);

    // If group is private and the user is not a member => no chat
    if (!grp.isPublic && !isMember) {
      alert('This is a private group and you are not a member.');
      return;
    }
    setSelectedGroup(grp);

    setMessages([]);
    setNewMessage('');

    const msgsRef = collection(db, 'groups', grp.id, 'messages');
    // Real-time listener
    const unsub = onSnapshot(query(msgsRef, orderBy('timestamp','asc')), (snap) => {
      const msgList = snap.docs.map(ds => ({ id: ds.id, ...ds.data() }));
      setMessages(msgList);
      // scroll to bottom
      if (messagesRef.current) {
        setTimeout(() => {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }, 100);
      }
    });
    // You could store unsub in state to remove it if user deselects group
  };

  /**
   * Send a new chat message
   */
  const handleSendMessage = async () => {
    if (!selectedGroup) return;
    const user = auth.currentUser;
    if (!user) {
      alert('Must be logged in');
      return;
    }
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'groups', selectedGroup.id, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        timestamp: new Date()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      alert('Failed to send message');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Groups
      </Typography>

      {/* CREATE GROUP DIALOG */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Event search input + results */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Search an event by name"
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={async () => {
                if (!eventSearchQuery.trim()) return;
                try {
                  setSearchingEvents(true);
                  const resp = await axios.get(
                    'https://app.ticketmaster.com/discovery/v2/events.json',
                    {
                      params: {
                        apikey: TICKETMASTER_API_KEY,
                        keyword: eventSearchQuery,
                        classificationName: 'music',
                        size: 5,
                      }
                    }
                  );
                  const data = resp.data._embedded?.events || [];
                  setEventSearchResults(data.map(ev => ({
                    id: ev.id,
                    name: ev.name
                  })));
                } catch (err) {
                  console.error('Error searching Ticketmaster:', err);
                  alert('Event search failed');
                } finally {
                  setSearchingEvents(false);
                }
              }}
              sx={{ mt: 1 }}
            >
              Search
            </Button>

            {searchingEvents && <CircularProgress size={24} sx={{ ml: 2 }} />}

            {/* Show the event results as a simple list below */}
            <List sx={{ maxHeight: 150, overflowY: 'auto', mt: 1 }}>
              {eventSearchResults.map((ev) => (
                <ListItem
                  key={ev.id}
                  button
                  onClick={() => {
                    setEventId(ev.id);
                    setEventName(ev.name);
                    setEventSearchQuery(ev.name); // reflect the selection
                    setEventSearchResults([]);
                  }}
                >
                  <ListItemText primary={ev.name} secondary={ev.id} />
                </ListItem>
              ))}
            </List>

            {/* Show the chosen event name if selected */}
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
                onChange={(e) => setIsPublic(e.target.checked)}
              />
            }
            label="Public Group?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* CREATE GROUP + SEARCH */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ fontWeight: 'bold' }}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Group
        </Button>
        <TextField
          label="Search Groups or Events"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </Box>

      {loadingGroups ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* LEFT PANEL: Groups List */}
          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Available Groups
            </Typography>
            <TransitionGroup component={null}>
              {filteredGroups.length === 0 ? (
                <Typography>No groups found.</Typography>
              ) : (
                filteredGroups.map((grp) => {
                  const user = auth.currentUser;
                  const isOwner = user && (grp.ownerId === user.uid);
                  const isMember = user && grp.members?.includes(user.uid);

                  return (
                    <CSSTransition key={grp.id} classNames="card" timeout={400}>
                      <Box
                        sx={{
                          backgroundColor: '#333',  // darker color for visibility
                          color: '#fff',
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          border: '1px solid #444'
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {grp.name} {grp.isPublic ? '(Public)' : '(Private)'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {grp.description}
                        </Typography>

                        {/* Show event name if we have it */}
                        {grp.eventName && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Event: {grp.eventName}
                          </Typography>
                        )}
                        {/* Also show event ID if you want */}
                        {grp.eventId && (
                          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                            Event ID: {grp.eventId}
                          </Typography>
                        )}

                        {/* Display all members no matter what */}
                        {grp.members && grp.members.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Members ({grp.members.length}):
                            </Typography>
                            {grp.members.map((mUid) => (
                              <Box key={mUid} sx={{ display: 'flex', gap: 1, pl: 2 }}>
                                <Typography variant="body2">{mUid}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* If I'm the owner, show pending requests & manage membership */}
                        {isOwner && grp.pendingRequests && grp.pendingRequests.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Pending Requests:
                            </Typography>
                            {grp.pendingRequests.map((reqUid) => (
                              <Box key={reqUid} sx={{ display: 'flex', gap: 1, pl: 2 }}>
                                <Typography variant="body2">{reqUid}</Typography>
                                <Button size="small"
                                  onClick={() => handleAcceptRequest(grp, reqUid)}
                                >
                                  Accept
                                </Button>
                                <Button size="small"
                                  onClick={() => handleDenyRequest(grp, reqUid)}
                                >
                                  Deny
                                </Button>
                              </Box>
                            ))}
                          </Box>
                        )}

                        {/* If I'm the owner, show a Kick button for each member (besides me) */}
                        {isOwner && grp.members && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Kick members:
                            </Typography>
                            {grp.members.map((mUid) => (
                              mUid !== grp.ownerId && (
                                <Box key={mUid} sx={{ display: 'flex', gap: 1, pl: 2 }}>
                                  <Typography variant="body2">{mUid}</Typography>
                                  <Button
                                    size="small"
                                    onClick={() => handleKickMember(grp, mUid)}
                                  >
                                    Kick
                                  </Button>
                                </Box>
                              )
                            ))}
                          </Box>
                        )}

                        {/* If user not a member or owner => join or request */}
                        {user && !isMember && user.uid !== grp.ownerId && (
                          <Button
                            variant="contained"
                            onClick={() => handleJoinOrRequest(grp)}
                          >
                            {grp.isPublic ? 'Join' : 'Request'}
                          </Button>
                        )}

                        {/* If group is public or I'm a member => open group chat */}
                        {(grp.isPublic || isMember) && (
                          <Button
                            variant="outlined"
                            sx={{ ml: 2 }}
                            onClick={() => handleSelectGroup(grp)}
                          >
                            Open Group
                          </Button>
                        )}
                      </Box>
                    </CSSTransition>
                  );
                })
              )}
            </TransitionGroup>
          </Paper>

          {/* RIGHT PANEL: Group Chat if selected */}
          {selectedGroup && (
            <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Group Chat - {selectedGroup.name}
              </Typography>
              {/* Chat messages */}
              <Box
                ref={messagesRef}
                sx={{
                  flex: 1,
                  border: '1px solid #ccc',
                  borderRadius: 2,
                  p: 1,
                  mb: 2,
                  overflowY: 'auto'
                }}
              >
                {messages.map((msg) => (
                  <Box key={msg.id} sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {msg.senderId}:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {msg.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {/* New message input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button variant="contained" onClick={handleSendMessage}>
                  Send
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* CREATE GROUP dialog is above */}
    </Container>
  );
}

export default GroupsPage;
