import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../constants/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore
  const fetchUserData = async (userId, userEmail) => {
    try {
      // First try to get by userId
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Fetched user data by ID:", data);
        return data;
      }

      // If not found by ID, try to find by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log("Fetched user data by email:", data);
        return data;
      }

      console.log("No user data found in Firestore");
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Update user data function that can be called from other components
  const updateUserContext = async (userId, userEmail) => {
    try {
      const data = await fetchUserData(userId, userEmail);
      if (data) {
        console.log("Updating user context with:", data);
        setCurrentUser(prev => ({
          ...(prev || {}),
          uid: userId,
          userId: userId,
          role: data.role,
          name: data.name,
          email: userEmail || data.email
        }));
        return data;
      }
    } catch (error) {
      console.error('Error updating user context:', error);
    }
    return null;
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Set initial basic auth info
          setCurrentUser(prev => ({
            ...(prev || {}),
            uid: user.uid,
            email: user.email,
          }));

          // Fetch and set complete user data
          const userData = await fetchUserData(user.uid, user.email);
          if (userData) {
            console.log("Setting complete user data:", userData);
            setCurrentUser(prev => ({
              ...(prev || {}),
              uid: user.uid,
              userId: user.uid,
              role: userData.role,
              name: userData.name,
              email: user.email
            }));
          } else {
            console.log("No Firestore data found for user");
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Debug log to see current user state
  useEffect(() => {
    console.log("Current user state:", currentUser);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    updateUserContext,
    fetchUserData,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

