

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../apiConfig';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await axios.get('/api/auth/profile');

          setUser(response.data);
          setAuthToken(token);

        } catch (error) {
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("Auth Error: Logging out due to 401/403 response.");
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setAuthToken(null);
          } else {
            console.error("Could not verify session. Backend might be temporarily unavailable or returning an error.", error);
          }
        }
      } else {
        setUser(null);
      }
    };

    initializeAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setAuthToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (token) => {
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const response = await axios.get('/api/auth/profile');
      setUser(response.data);
      setAuthToken(token);
    } catch (error) {
      logout();
    }
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const response = await axios.get('/api/auth/profile');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to refresh user data, logging out.", error);
            logout();
        }
    }
  }, [logout]);

  useEffect(() => {
    if (authToken && user && !user.is_banned) {
      if (!socketRef.current) {
        console.log('AuthProvider: Connecting socket...');
        const newSocket = io(API_BASE_URL, {
          transports: ['websocket'],
          auth: { token: authToken },
          path: "/socket.io/",
        });

        newSocket.on('linkStatus', (data) => {
          if (data.success) {
            toast.success(`Successfully linked to Minecraft account: ${data.minecraftUsername}!`);
            setUser(prevUser => ({ ...prevUser, minecraft_username: data.minecraftUsername, minecraft_uuid: 'linked' }));
          } else {
            toast.error(`Linking failed: ${data.error}`);
          }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('linkStatus');
      }
    }
  }, [authToken, user]);

  const updateAuthToken = useCallback((token) => {
    login(token);
  }, [login]);

  const value = useMemo(() => ({
    isLoggedIn: !!user,
    user,
    authToken,
    socket,
    login,
    logout,
    updateAuthToken,
    refreshUser,
  }), [user, authToken, socket, login, logout, updateAuthToken, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
