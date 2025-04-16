// src/pages/MessagingPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function MessagingPage() {
  const { chatId } = useParams();    // either: undefined, "<friendUid>", or "group_<groupId>"
  const navigate = useNavigate();
  const me = auth.currentUser;
  const endRef = useRef();

  const [friends, setFriends] = useState([]);
  const [groups, setGroups]   = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [peerData, setPeerData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(!!chatId);
  const [newMessage, setNewMessage] = useState('');

  // 1) If no chatId, load BOTH your friends & your groups
  useEffect(() => {
    if (chatId || !me) return;
    setLoadingList(true);

    // fetch friends
    const friendsQ = query(
      collection(db, 'friends'),
      where('users', 'array-contains', me.uid)
    );

    // fetch groups you're in
    const groupsQ = query(
      collection(db, 'groups'),
      where('members', 'array-contains', me.uid)
    );

    Promise.all([ getDocs(friendsQ), getDocs(groupsQ) ])
      .then(async ([fSnap, gSnap]) => {
        // build friend list
        const fl = await Promise.all(fSnap.docs.map(async d => {
          const other = d.data().users.find(u => u !== me.uid);
          const udoc = await getDoc(doc(db, 'users', other));
          return { 
            id: other,
            username: udoc.data()?.username,
            avatar: udoc.data()?.profilePicture
          };
        }));
        setFriends(fl);

        // build group list
        const gl = gSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          avatar: null  // you can pick a group icon if you like
        }));
        setGroups(gl);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, [chatId, me]);

  // 2) If chatId is present, join that chat stream
  useEffect(() => {
    if (!chatId || !me) return;
    const isGroup = chatId.startsWith('group_');
    setLoadingChat(true);

    if (isGroup) {
      // load group meta
      const gid = chatId.replace(/^group_/,'');
      getDoc(doc(db,'groups',gid))
        .then(snap => setPeerData({ name: snap.data()?.name }))
        .catch(console.error);

      // listen to group messages
      const msgs = collection(db,'groups',gid,'messages');
      const unsub = onSnapshot(
        query(msgs, orderBy('timestamp','asc')),
        snap => {
          setMessages(snap.docs.map(d=>({ id:d.id, ...d.data() })));
          setLoadingChat(false);
          setTimeout(()=> endRef.current?.scrollIntoView({behavior:'smooth'}),100);
        },
        console.error
      );
      return () => unsub();
    } else {
      // friend chat
      getDoc(doc(db,'users',chatId))
        .then(snap => setPeerData({ username: snap.data()?.username,
                                   avatar: snap.data()?.profilePicture }))
        .catch(console.error);

      // ensure chat doc exists under "chats/<me>_<friend>/messages"
      const uids = [me.uid, chatId].sort().join('_');
      const chatRef = doc(db,'chats',uids);
      getDoc(chatRef).then(snap=>{
        if (!snap.exists()) setDoc(chatRef,{participants:[me.uid,chatId]});
      });

      // subscribe to /chats/<uids>/messages
      const msgs = collection(db,'chats',uids,'messages');
      const unsub = onSnapshot(
        query(msgs, orderBy('timestamp','asc')),
        snap => {
          setMessages(snap.docs.map(d=>({ id:d.id, ...d.data() })));
          setLoadingChat(false);
          setTimeout(()=> endRef.current?.scrollIntoView({behavior:'smooth'}),100);
        },
        console.error
      );
      return ()=>unsub();
    }
  }, [chatId, me]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;
    const isGroup = chatId.startsWith('group_');
    let targetCol;
    if (isGroup) {
      const gid = chatId.replace(/^group_/,'');
      targetCol = collection(db,'groups',gid,'messages');
    } else {
      const uids = [me.uid,chatId].sort().join('_');
      targetCol = collection(db,'chats',uids,'messages');
    }
    await addDoc(targetCol,{
      sender: me.uid,
      text: newMessage.trim(),
      timestamp: new Date()
    });
    setNewMessage('');
  };

  // --- RENDER ---

  //  ➤ no chatId? pick from friends or groups
  if (!chatId) {
    return (
      <Container sx={{mt:4}}>
        <Typography variant="h4"> Pick a chat </Typography>
        {loadingList
          ? <CircularProgress sx={{mt:4}}/>
          : <>
              <Typography sx={{mt:2}}> Friends </Typography>
              <List>
                {friends.map(f=>(
                  <ListItem key={f.id} button
                    onClick={()=>navigate(`/messaging/${f.id}`)}>
                    <ListItemAvatar>
                      <Avatar src={f.avatar}/>
                    </ListItemAvatar>
                    <ListItemText primary={f.username}/>
                  </ListItem>
                ))}
                {friends.length===0 && <Typography>No friends yet.</Typography>}
              </List>

              <Typography sx={{mt:2}}> Groups </Typography>
              <List>
                {groups.map(g=>(
                  <ListItem key={g.id} button
                    onClick={()=>navigate(`/messaging/group_${g.id}`)}>
                    <ListItemAvatar>
                      <Avatar>{g.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={g.name}/>
                  </ListItem>
                ))}
                {groups.length===0 && <Typography>No group chats.</Typography>}
              </List>
            </>
        }
      </Container>
    );
  }

  //  ➤ in‑chat view
  return (
    <Container sx={{mt:4}}>
      <Typography variant="h4">
        { chatId.startsWith('group_')
          ? peerData?.name
          : peerData?.username }
      </Typography>

      {loadingChat
        ? <CircularProgress sx={{mt:4}}/>
        : <>
            <Box sx={{
              maxHeight:400, overflowY:'auto',
              border:'1px solid rgba(0,0,0,0.1)',
              borderRadius:1,p:1,mb:2
            }}>
              <List>
                {messages.map(m=>(
                  <ListItem key={m.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={
                        m.sender===me.uid
                          ? me.photoURL
                          : peerData?.avatar
                      }/>
                    </ListItemAvatar>
                    <ListItemText
                      primary={m.text}
                      secondary={new Date(m.timestamp?.toDate?.()||m.timestamp)
                                 .toLocaleString()}
                    />
                  </ListItem>
                ))}
                <div ref={endRef}/>
              </List>
            </Box>

            <Box sx={{display:'flex',gap:1}}>
              <TextField
                fullWidth
                label="Type a message…"
                value={newMessage}
                onChange={e=>setNewMessage(e.target.value)}
                onKeyDown={e=>e.key==='Enter' && sendMessage()}
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </Box>
          </>
      }
    </Container>
  );
}
