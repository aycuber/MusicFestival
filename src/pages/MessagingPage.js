// src/pages/MessagingPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  TextField,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  keyframes
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
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

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default function MessagingPage() {
  const { chatId } = useParams();    // undefined, "<friendUid>" or "group_<groupId>"
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

  // 1) If no chatId, load friends & groups for selection
  useEffect(() => {
    if (chatId || !me) return;
    setLoadingList(true);

    const friendsQ = query(
      collection(db, 'friends'),
      where('users', 'array-contains', me.uid)
    );
    const groupsQ = query(
      collection(db, 'groups'),
      where('members', 'array-contains', me.uid)
    );

    Promise.all([ getDocs(friendsQ), getDocs(groupsQ) ])
      .then(async ([fSnap, gSnap]) => {
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

        const gl = gSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          avatar: d.data().photoURL || null
        }));
        setGroups(gl);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, [chatId, me]);

  // 2) If chatId is present, subscribe to that chat’s messages
  useEffect(() => {
    if (!chatId || !me) return;
    const isGroup = chatId.startsWith('group_');
    setLoadingChat(true);

    if (isGroup) {
      const gid = chatId.replace(/^group_/, '');
      getDoc(doc(db,'groups',gid))
        .then(snap =>
          setPeerData({
            name: snap.data()?.name,
            avatar: snap.data()?.photoURL
          })
        )
        .catch(console.error);

      const msgs = collection(db,'groups',gid,'messages');
      const unsub = onSnapshot(
        query(msgs, orderBy('timestamp','asc')),
        snap => {
          setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() })));
          setLoadingChat(false);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
        },
        console.error
      );
      return () => unsub();
    } else {
      getDoc(doc(db,'users',chatId))
        .then(snap =>
          setPeerData({
            username: snap.data()?.username,
            avatar: snap.data()?.profilePicture
          })
        )
        .catch(console.error);

      const uids = [me.uid, chatId].sort().join('_');
      const chatRef = doc(db,'chats',uids);
      getDoc(chatRef).then(snap => {
        if (!snap.exists()) setDoc(chatRef,{ participants:[me.uid,chatId] });
      });

      const msgs = collection(db,'chats',uids,'messages');
      const unsub = onSnapshot(
        query(msgs, orderBy('timestamp','asc')),
        snap => {
          setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() })));
          setLoadingChat(false);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
        },
        console.error
      );
      return () => unsub();
    }
  }, [chatId, me]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;
    const isGroup = chatId.startsWith('group_');
    let targetCol;

    if (isGroup) {
      const gid = chatId.replace(/^group_/, '');
      targetCol = collection(db,'groups',gid,'messages');
    } else {
      const uids = [me.uid, chatId].sort().join('_');
      targetCol = collection(db,'chats',uids,'messages');
    }

    await addDoc(targetCol, {
      sender: me.uid,
      text: newMessage.trim(),
      timestamp: new Date()
    });
    setNewMessage('');
  };

  // ─── CHAT SELECTION ──────────────────────────────────────────────────────────
  if (!chatId) {
    return (
      <Container sx={{ mt:4 }}>
        <Typography variant="h4">Pick a Chat</Typography>
        {loadingList ? (
          <CircularProgress sx={{ mt:4 }} />
        ) : (
          <>
            <Typography variant="h6" sx={{ mt:2 }}>Friends</Typography>
            {friends.length ? (
              <List>
                {friends.map(f => (
                  <ListItem
                    key={f.id}
                    button
                    onClick={() => navigate(`/messaging/${f.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar src={f.avatar} />
                    </ListItemAvatar>
                    <ListItemText primary={f.username} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No friends yet.</Typography>
            )}

            <Typography variant="h6" sx={{ mt:2 }}>Groups</Typography>
            {groups.length ? (
              <List>
                {groups.map(g => (
                  <ListItem
                    key={g.id}
                    button
                    onClick={() => navigate(`/messaging/group_${g.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar src={g.avatar}>{g.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={g.name} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No group chats.</Typography>
            )}
          </>
        )}
      </Container>
    );
  }

  // ─── CHAT VIEW ────────────────────────────────────────────────────────────────
  return (
    <Container sx={{ 
      mt:4,
      display:'flex',
      flexDirection:'column',
      height:'80vh' 
    }}>
      {/* Header with avatar + name */}
      <Box sx={{ display:'flex', alignItems:'center', mb:2 }}>
        <Avatar
          src={
            chatId.startsWith('group_')
              ? peerData?.avatar
              : peerData?.avatar
          }
          sx={{ width:40, height:40, mr:1 }}
        >
          {chatId.startsWith('group_')
            ? peerData?.name?.charAt(0)
            : peerData?.username?.charAt(0)}
        </Avatar>
        <Typography variant="h5">
          {chatId.startsWith('group_') ? peerData?.name : peerData?.username}
        </Typography>
      </Box>

      {loadingChat ? (
        <Box sx={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Messages List */}
          <Box
            sx={{
              flex:1,
              overflowY:'auto',
              display:'flex',
              flexDirection:'column',
              gap:1,
              px:1, py:2,
              bgcolor:'background.paper',
              borderRadius:1,
            }}
          >
            {messages.map(m => {
              const isMe = m.sender === me.uid;
              const time = new Date(
                m.timestamp?.toDate?.() || m.timestamp
              ).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

              return (
                <Box
                  key={m.id}
                  sx={{
                    display:'flex',
                    alignItems:'flex-end',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    animation: `${fadeSlideIn} 0.25s ease-out`
                  }}
                >
                  {!isMe && (
                    <Avatar
                      src={peerData?.avatar}
                      sx={{ width:32, height:32, mr:1 }}
                    />
                  )}
                  <Box sx={{ maxWidth:'70%' }}>
                    <Box
                      sx={{
                        bgcolor: isMe ? '#e91e63' : '#9c27b0',
                        color:'#fff',
                        borderRadius: isMe
                          ? '16px 16px 0 16px'
                          : '16px 16px 16px 0',
                        p:1,
                        wordBreak:'break-word'
                      }}
                    >
                      <Typography variant="body2">{m.text}</Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color:'rgba(255,255,255,0.6)',
                        mt:0.3,
                        textAlign: isMe ? 'right' : 'left',
                        display:'block'
                      }}
                    >
                      {time}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={endRef} />
          </Box>

          {/* Input Bar */}
          <Box
            component="form"
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            sx={{ display:'flex', alignItems:'center', gap:1, mt:2 }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message…"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Container>
  );
}
