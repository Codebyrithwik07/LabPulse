import React, { createContext, useContext, useState, useEffect } from 'react';
import { metaApi } from '../api/client';

const AuthContext = createContext();

export const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Dr. Aris Thorne',
    email: 'a.thorne@college.edu',
    role: 'LAB_STAFF',
    department: 'Electrical & Computer Engineering',
    title: 'Lab Supervisor',
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'm.vance@college.edu',
    role: 'LAB_STAFF',
    department: 'Central Instrumentation Facility',
    title: 'Precision Systems Technician',
  },
  {
    id: 5,
    name: 'Priya Sharma',
    email: 'p.sharma@student.college.edu',
    role: 'STUDENT',
    department: 'Electrical Engineering (Batch 2023-27)',
    title: 'Senior Student Researcher',
  },
  {
    id: 4,
    name: 'Prof. Nathan Vance',
    email: 'n.vance@college.edu',
    role: 'LAB_ADMIN',
    department: 'Dean of Academic Laboratories',
    title: 'Dean of Laboratories',
  },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('labpulse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_USERS[0]; // Default to Dr. Aris Thorne (Lab Staff)
  });

  const [availableUsers, setAvailableUsers] = useState(DEFAULT_USERS);

  useEffect(() => {
    // Optionally fetch users list from database
    metaApi
      .getUsers()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setAvailableUsers(res.data);
        }
      })
      .catch(() => {
        // Fallback to default predefined users
      });
  }, []);

  const switchUser = (userId) => {
    const target = availableUsers.find((u) => u.id === parseInt(userId, 10));
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('labpulse_user', JSON.stringify(target));
    }
  };

  const isStaff = currentUser?.role === 'LAB_STAFF' || currentUser?.role === 'LAB_ADMIN';
  const isAdmin = currentUser?.role === 'LAB_ADMIN';
  const isStudent = currentUser?.role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        isStaff,
        isAdmin,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
