import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCampo: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  quickLoginAs: (role: UserRole) => Promise<void>;
  switchActiveRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure Andrey Yuri has Admin privileges
        if (user.email === 'andreyuri38@gmail.com' && data.role !== 'admin') {
          data.role = 'admin';
          await setDoc(userRef, { ...data, role: 'admin' }, { merge: true });
        }
        setProfile(data);
      } else {
        // Create initial profile
        const isMasterAdmin = user.email === 'andreyuri38@gmail.com' || user.email?.includes('admin');
        const newProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário'),
          email: user.email || '',
          role: isMasterAdmin ? 'admin' : 'campo',
          assignedFrenteIds: [],
          assignedWorkIds: [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore:', err);
      // Fallback local profile for offline or initial connection
      const isMasterAdmin = user.email === 'andreyuri38@gmail.com' || user.email?.includes('admin');
      setProfile({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: isMasterAdmin ? 'admin' : 'campo',
        assignedFrenteIds: [],
        assignedWorkIds: [],
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    await fetchProfile(result.user);
  };

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await fetchProfile(userCredential.user);
  };

  const register = async (email: string, pass: string, name: string, role: UserRole = 'campo') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      id: userCredential.user.uid,
      name,
      email,
      role: email === 'andreyuri38@gmail.com' ? 'admin' : role,
      assignedFrenteIds: [],
      assignedWorkIds: [],
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userCredential.user.uid}`);
    }
    setProfile(newProfile);
  };

  // Switch role during active testing without breaking Firebase session
  const switchActiveRole = async (targetRole: UserRole) => {
    if (profile) {
      const updated = { ...profile, role: targetRole };
      setProfile(updated);
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), { role: targetRole }, { merge: true });
        } catch (e) {
          console.warn('Could not persist role switch to Firestore:', e);
        }
      }
    }
  };

  // Quick switch for field staff and admin testing
  const quickLoginAs = async (role: UserRole) => {
    // If user is already authenticated, simply switch active role view
    if (currentUser && profile) {
      await switchActiveRole(role);
      return;
    }

    const email = role === 'admin' ? 'andreyuri38@gmail.com' : 'campo.nivelar@obras.com';
    const password = 'nivelarPassword123!';

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('operation-not-allowed') || err.message.includes('auth/operation-not-allowed'))) {
        throw new Error(
          'O método de autenticação por E-mail e Senha não está ativado no Firebase Console deste projeto. Por favor, utilize o botão "Entrar com Google" para autenticar com segurança (o e-mail andreyuri38@gmail.com já possui acesso de Administrador).'
        );
      }
      // If user doesn't exist yet in Firebase Auth, try registering
      try {
        await register(
          email,
          password,
          role === 'admin' ? 'Engenheiro Sócio (Admin)' : 'Carlos Encarregado (Campo)',
          role
        );
      } catch (regErr: unknown) {
        if (regErr instanceof Error && (regErr.message.includes('operation-not-allowed') || regErr.message.includes('auth/operation-not-allowed'))) {
          throw new Error(
            'O método E-mail/Senha não está ativado no Firebase Console. Utilize o botão "Entrar com Google" para entrar diretamente com sua conta Google autorizada.'
          );
        }
        throw regErr;
      }
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isCampo = profile?.role === 'campo';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin,
        isCampo,
        signInWithGoogle,
        login,
        register,
        quickLoginAs,
        switchActiveRole,
        logout,
        refreshProfile,
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
