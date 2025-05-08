import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, UserPlus, MessageSquare, UserMinus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState([]);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchFriendData();
  }, []);

  const fetchFriendData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Fetch friend requests
      const reqQ = query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending')
      );
      const reqSnap = await getDocs(reqQ);
      const requests = await Promise.all(
        reqSnap.docs.map(async docSnap => {
          const data = docSnap.data();
          const u = await getDoc(doc(db, 'users', data.from));
          return {
            id: docSnap.id,
            from: data.from,
            fromUsername: u.exists() ? u.data().username : 'Unknown',
            profilePicture: u.exists() ? u.data().profilePicture : '',
            status: data.status
          };
        })
      );
      setFriendRequests(requests);

      // Fetch accepted friends
      const accQ = query(
        collection(db, 'friends'),
        where('users', 'array-contains', user.uid),
        where('status', '==', 'accepted')
      );
      const accSnap = await getDocs(accQ);
      const accList = await Promise.all(
        accSnap.docs.map(async docSnap => {
          const ids = docSnap.data().users;
          const friendId = ids.find(id => id !== user.uid);
          const u = await getDoc(doc(db, 'users', friendId));
          if (!u.exists()) return null;
          return {
            id: friendId,
            username: u.data().username,
            profilePicture: u.data().profilePicture
          };
        })
      );
      setAcceptedFriends(accList.filter(Boolean));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch friend data');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const usersQ = query(
        collection(db, 'users'),
        where('username', '==', searchQuery)
      );
      const snap = await getDocs(usersQ);
      setSearchResults(
        snap.empty ? [] : snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async toUserId => {
    if (!auth.currentUser) return alert('Please log in first');
    try {
      await setDoc(
        doc(db, 'friendRequests', `${auth.currentUser.uid}_${toUserId}`),
        { from: auth.currentUser.uid, to: toUserId, status: 'pending' }
      );
      setSentRequests(prev => new Set(prev).add(toUserId));
      alert('Friend request sent!');
    } catch (err) {
      console.error(err);
      alert('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async requestId => {
    try {
      const reqRef = doc(db, 'friendRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      const { from } = reqSnap.data();
      await setDoc(
        doc(db, 'friends', `${auth.currentUser.uid}_${from}`),
        { users: [auth.currentUser.uid, from], status: 'accepted' }
      );
      await updateDoc(reqRef, { status: 'accepted' });
      fetchFriendData();
    } catch (err) {
      console.error(err);
      alert('Failed to accept friend request');
    }
  };

  const removeFriend = async friendId => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const doc1 = doc(db, 'friends', `${user.uid}_${friendId}`);
      const doc2 = doc(db, 'friends', `${friendId}_${user.uid}`);
      await Promise.all([
        deleteDoc(doc1).catch(() => {}),
        deleteDoc(doc2).catch(() => {})
      ]);
      fetchFriendData();
    } catch (err) {
      console.error(err);
      alert('Failed to remove friend');
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
              Connect with Friends
            </h1>

            <div className="card p-6">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input pl-12"
                  placeholder="Search by username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                className="btn-primary w-full mt-4"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-12">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {searchResults.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    type="search"
                    onAction={() => sendFriendRequest(user.id)}
                    actionDisabled={sentRequests.has(user.id)}
                    navigate={navigate}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Friend Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {friendRequests.map(request => (
                  <UserCard
                    key={request.id}
                    user={{
                      id: request.from,
                      username: request.fromUsername,
                      profilePicture: request.profilePicture
                    }}
                    type="request"
                    onAction={() => acceptFriendRequest(request.id)}
                    navigate={navigate}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Friends</h2>
          {acceptedFriends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400">No friends yet. Start by searching for users above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {acceptedFriends.map(friend => (
                  <UserCard
                    key={friend.id}
                    user={friend}
                    type="friend"
                    onAction={() => removeFriend(friend.id)}
                    onMessage={() => navigate(`/messaging/${friend.id}`)}
                    navigate={navigate}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const UserCard = ({ user, type, onAction, onMessage, actionDisabled, navigate }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card p-4"
    >
      <div className="flex items-center gap-4">
        <img
          src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}`}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover cursor-pointer"
          onClick={() => navigate(`/users/${user.id}`)}
        />
        <div className="flex-1">
          <h3 className="font-semibold">{user.username}</h3>
        </div>
        <div className="flex gap-2">
          {type === 'search' && (
            <button
              className={`p-2 rounded-full transition-colors ${
                actionDisabled
                  ? 'bg-slate-700 text-slate-400'
                  : 'hover:bg-purple-900/50 text-purple-400'
              }`}
              onClick={onAction}
              disabled={actionDisabled}
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )}
          {type === 'request' && (
            <button
              className="p-2 rounded-full hover:bg-purple-900/50 text-purple-400 transition-colors"
              onClick={onAction}
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )}
          {type === 'friend' && (
            <>
              <button
                className="p-2 rounded-full hover:bg-teal-900/50 text-teal-400 transition-colors"
                onClick={onMessage}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full hover:bg-red-900/50 text-red-400 transition-colors"
                onClick={onAction}
              >
                <UserMinus className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};