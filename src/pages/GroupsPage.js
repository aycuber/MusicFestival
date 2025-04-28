// src/pages/GroupsPage.js
import React, { useEffect, useState, useRef } from 'react';
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
  ListItemAvatar,
  ListItemText,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TICKETMASTER_API_KEY = 'Pzo8cbC1U1UGBhAYIlUVGt2L0N4mo5oN';

export default function GroupsPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // ── Groups list & search ───────────────────────────────────────────────
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const col = collection(db, 'groups');
      let all = [];

      // public
      const pub = await getDocs(query(col, where('isPublic', '==', true)));
      all.push(...pub.docs.map(d => ({ id: d.id, ...d.data() })));

      // fetch absolutely all groups (public and private)
      const allSnap = await getDocs(col);
      all.push(...allSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // dedupe
      const map = new Map();
      all.forEach(g => map.set(g.id, g));
      setGroups(Array.from(map.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const filtered = groups.filter(g => {
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.eventName?.toLowerCase().includes(q)
    );
  });

  // ── Create Group Dialog ────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // event live-search
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventSearchResults, setEventSearchResults] = useState([]);
  const [searchingEvents, setSearchingEvents] = useState(false);
  const [chosenEventId, setChosenEventId] = useState('');
  const [chosenEventName, setChosenEventName] = useState('');

  // photo upload
  const fileInputRef = useRef(null);
  const [groupPhotoFile, setGroupPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // debounced Ticketmaster search (Create)
  useEffect(() => {
    if (eventSearchQuery.trim().length < 3) {
      setEventSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearchingEvents(true);
      try {
        const resp = await axios.get(
          'https://app.ticketmaster.com/discovery/v2/events.json',
          {
            params: {
              apikey: TICKETMASTER_API_KEY,
              keyword: eventSearchQuery,
              classificationName: 'music',
              size: 5,
            },
          }
        );
        const evs = resp.data._embedded?.events || [];
        setEventSearchResults(
          evs.map(ev => ({
            id: ev.id,
            name: ev.name,
            image:
              ev.images.find(i => i.ratio === '16_9')?.url ||
              ev.images[0]?.url ||
              '',
            url: ev.url,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingEvents(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [eventSearchQuery]);

  const onPhotoChange = e => {
    if (e.target.files?.[0]) setGroupPhotoFile(e.target.files[0]);
  };

  const handleCreate = async () => {
    if (!user) return alert('Log in to create a group');
    if (!chosenEventId) return alert('Please select an event');
    setUploadingPhoto(true);
    try {
      let photoURL = '';
      if (groupPhotoFile) {
        const photoRef = ref(
          storage,
          `groupPhotos/${Date.now()}_${groupPhotoFile.name}`
        );
        await uploadBytes(photoRef, groupPhotoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, 'groups'), {
        name: groupName,
        description: groupDesc,
        isPublic,
        eventId: chosenEventId,
        eventName: chosenEventName,
        ownerId: user.uid,
        members: [user.uid],
        pendingRequests: [],
        photoURL,
      });

      handleCreateClose();
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Error creating group');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
    setGroupName('');
    setGroupDesc('');
    setIsPublic(true);
    setEventSearchQuery('');
    setEventSearchResults([]);
    setChosenEventId('');
    setChosenEventName('');
    setGroupPhotoFile(null);
  };

  // ── Edit Group (Settings) Dialog ───────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

  // event live-search (Edit)
  const [editEventSearchQuery, setEditEventSearchQuery] = useState('');
  const [editEventSearchResults, setEditEventSearchResults] = useState([]);
  const [editSearchingEvents, setEditSearchingEvents] = useState(false);
  const [editChosenEventId, setEditChosenEventId] = useState('');
  const [editChosenEventName, setEditChosenEventName] = useState('');

  // photo upload (Edit)
  const editFileInputRef = useRef(null);
  const [editGroupPhotoFile, setEditGroupPhotoFile] = useState(null);
  const [settingsUploadingPhoto, setSettingsUploadingPhoto] = useState(false);

  // open settings & prefill
  const openSettings = grp => {
    setEditingGroup(grp);
    setSettingsOpen(true);

    setEditGroupName(grp.name);
    setEditGroupDesc(grp.description);
    setEditIsPublic(grp.isPublic);

    setEditEventSearchQuery(grp.eventName || '');
    setEditChosenEventId(grp.eventId || '');
    setEditChosenEventName(grp.eventName || '');
    setEditEventSearchResults([]);

    setEditGroupPhotoFile(null);
  };
  const closeSettings = () => setSettingsOpen(false);

  // debounced Ticketmaster search (Edit)
  useEffect(() => {
    if (!settingsOpen) return;
    if (editEventSearchQuery.trim().length < 3) {
      setEditEventSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setEditSearchingEvents(true);
      try {
        const resp = await axios.get(
          'https://app.ticketmaster.com/discovery/v2/events.json',
          {
            params: {
              apikey: TICKETMASTER_API_KEY,
              keyword: editEventSearchQuery,
              classificationName: 'music',
              size: 5,
            },
          }
        );
        const evs = resp.data._embedded?.events || [];
        setEditEventSearchResults(
          evs.map(ev => ({
            id: ev.id,
            name: ev.name,
            image:
              ev.images.find(i => i.ratio === '16_9')?.url ||
              ev.images[0]?.url ||
              '',
            url: ev.url,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setEditSearchingEvents(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [editEventSearchQuery, settingsOpen]);

  const onEditPhotoChange = e => {
    if (e.target.files?.[0]) setEditGroupPhotoFile(e.target.files[0]);
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;
    setSettingsUploadingPhoto(true);
    try {
      let photoURL = editingGroup.photoURL || '';
      if (editGroupPhotoFile) {
        const photoRef = ref(
          storage,
          `groupPhotos/${Date.now()}_${editGroupPhotoFile.name}`
        );
        await uploadBytes(photoRef, editGroupPhotoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      const groupRef = doc(db, 'groups', editingGroup.id);
      const data = {
        name: editGroupName,
        description: editGroupDesc,
        isPublic: editIsPublic,
        eventId: editChosenEventId,
        eventName: editChosenEventName,
      };
      if (photoURL) data.photoURL = photoURL;

      await updateDoc(groupRef, data);
      closeSettings();
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Error updating group');
    } finally {
      setSettingsUploadingPhoto(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Groups
      </Typography>

      {/* Create & Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create New Group
        </Button>
        <TextField
          label="Search Groups or Events"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          fullWidth
        />
      </Box>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={handleCreateClose} fullWidth maxWidth="sm">
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

          {/* Event live-search */}
          <TextField
            fullWidth
            label="Search an event"
            value={eventSearchQuery}
            onChange={e => setEventSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchingEvents ? <CircularProgress size={20} /> : <SearchIcon />}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          {eventSearchResults.length > 0 && (
            <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, p: 1 }}>
              <List dense>
                {eventSearchResults.map(ev => (
                  <ListItem
                    key={ev.id}
                    button
                    divider
                    onClick={() => {
                      setChosenEventId(ev.id);
                      setChosenEventName(ev.name);
                      setEventSearchQuery(ev.name);
                      setEventSearchResults([]);
                    }}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          window.open(ev.url, '_blank');
                        }}
                      >
                        Show Event
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={ev.image} />
                    </ListItemAvatar>
                    <ListItemText primary={ev.name} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
          {chosenEventName && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              ▶ Chosen Event: {chosenEventName}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={
              <Avatar
                src={groupPhotoFile && URL.createObjectURL(groupPhotoFile)}
                sx={{ width: 24, height: 24 }}
              />
            }
            onClick={() => fileInputRef.current.click()}
            sx={{ mb: 2 }}
          >
            {groupPhotoFile ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onPhotoChange}
          />

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
          <Button onClick={handleCreateClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings (Edit) Dialog */}
      <Dialog open={settingsOpen} onClose={closeSettings} fullWidth maxWidth="sm">
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={editGroupName}
            onChange={e => setEditGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={editGroupDesc}
            onChange={e => setEditGroupDesc(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Event live-search */}
          <TextField
            fullWidth
            label="Search an event"
            value={editEventSearchQuery}
            onChange={e => setEditEventSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {editSearchingEvents ? <CircularProgress size={20} /> : <SearchIcon />}
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          {editEventSearchResults.length > 0 && (
            <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, p: 1 }}>
              <List dense>
                {editEventSearchResults.map(ev => (
                  <ListItem
                    key={ev.id}
                    button
                    divider
                    onClick={() => {
                      setEditChosenEventId(ev.id);
                      setEditChosenEventName(ev.name);
                      setEditEventSearchQuery(ev.name);
                      setEditEventSearchResults([]);
                    }}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          window.open(ev.url, '_blank');
                        }}
                      >
                        Show Event
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={ev.image} />
                    </ListItemAvatar>
                    <ListItemText primary={ev.name} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
          {editChosenEventName && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              ▶ Chosen Event: {editChosenEventName}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={
              <Avatar
                src={
                  editGroupPhotoFile
                    ? URL.createObjectURL(editGroupPhotoFile)
                    : editingGroup?.photoURL
                }
                sx={{ width: 24, height: 24 }}
              />
            }
            onClick={() => editFileInputRef.current.click()}
            sx={{ mb: 2 }}
          >
            {editGroupPhotoFile ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <input
            ref={editFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onEditPhotoChange}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={editIsPublic}
                onChange={e => setEditIsPublic(e.target.checked)}
              />
            }
            label="Public Group?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSettings}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={settingsUploadingPhoto}
          >
            {settingsUploadingPhoto ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Groups List */}
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
                  {/* header with Settings */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {grp.photoURL ? (
                        <Avatar src={grp.photoURL} />
                      ) : (
                        <Avatar>{grp.name.charAt(0)}</Avatar>
                      )}
                      <Box>
                        <Typography variant="h6">
                          {grp.name} {grp.isPublic ? '(Public)' : '(Private)'}
                        </Typography>
                        {grp.eventName && (
                          <Typography variant="body2">🎫 {grp.eventName}</Typography>
                        )}
                      </Box>
                    </Box>
                    {isOwner && (
                      <IconButton
                        size="small"
                        onClick={() => openSettings(grp)}
                        sx={{ color: '#fff' }}
                      >
                        <SettingsIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Typography sx={{ mb: 1 }}>{grp.description}</Typography>

                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Members ({grp.members.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {grp.members.map(uid => (
                      <MemberBadge key={uid} uid={uid} />
                    ))}
                  </Box>

                  {isOwner && grp.pendingRequests.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight="bold">Pending Requests</Typography>
                      {grp.pendingRequests.map(uid => (
                        <Box
                          key={uid}
                          sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                        >
                          <MemberBadge uid={uid} />
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
                      <Typography fontWeight="bold">Kick Members</Typography>
                      {grp.members
                        .filter(m => m !== grp.ownerId)
                        .map(uid => (
                          <Box
                            key={uid}
                            sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                          >
                            <MemberBadge uid={uid} />
                            <Button size="small" onClick={() => kick(grp, uid)}>
                              Kick
                            </Button>
                          </Box>
                        ))}
                    </Box>
                  )}

                  {!isMember && user?.uid !== grp.ownerId && (
                    <Button
                      variant="contained"
                      onClick={() => joinOrRequest(grp)}
                      sx={{ mr: 1 }}
                    >
                      {grp.isPublic ? 'Join' : 'Request'}
                    </Button>
                  )}
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

  // ── Helper: show username + avatar ─────────────────────────────────
  function MemberBadge({ uid }) {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
      import('firebase/firestore').then(fs => {
        const { doc, getDoc } = fs;
        getDoc(doc(db, 'users', uid)).then(snap => {
          if (snap.exists()) setUserData(snap.data());
        });
      });
    }, [uid]);

    if (!userData) return <Typography variant="body2">{uid}</Typography>;
    return (
      <Box
        onClick={() => navigate(`/users/${uid}`)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer'
        }}
      >
        <Avatar src={userData.profilePicture} sx={{ width: 24, height: 24 }} />
        <Typography variant="body2">{userData.username}</Typography>
      </Box>
    );
  }

  // ── Membership & Owner Actions ────────────────────────────────────────
  async function joinOrRequest(grp) {
    if (!user) return alert('Log in first');
    const refDoc = doc(db, 'groups', grp.id);
    try {
      if (grp.isPublic) {
        await updateDoc(refDoc, { members: arrayUnion(user.uid) });
      } else {
        await updateDoc(refDoc, { pendingRequests: arrayUnion(user.uid) });
      }
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Could not join/request');
    }
  }
  async function accept(grp, uid) {
    const refDoc = doc(db, 'groups', grp.id);
    await updateDoc(refDoc, {
      pendingRequests: arrayRemove(uid),
      members: arrayUnion(uid),
    });
    fetchGroups();
  }
  async function deny(grp, uid) {
    const refDoc = doc(db, 'groups', grp.id);
    await updateDoc(refDoc, { pendingRequests: arrayRemove(uid) });
    fetchGroups();
  }
  async function kick(grp, uid) {
    const refDoc = doc(db, 'groups', grp.id);
    await updateDoc(refDoc, { members: arrayRemove(uid) });
    fetchGroups();
  }
}
