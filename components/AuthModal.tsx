import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ArrowRight, LogIn, Chrome, User, Briefcase, ShoppingBag, Smile } from 'lucide-react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMockLogin?: (user: any, role: UserRole) => void;
}

// Helper to safely retrieve initialized Firebase App or attempt init if config exists
const getFirebaseApp = (): FirebaseApp | null => {
    if (getApps().length > 0) {
        return getApp();
    }
    const w = window as any;
    if (typeof w.__firebase_config !== 'undefined') {
        try {
            const config = typeof w.__firebase_config === 'string' 
                ? JSON.parse(w.__firebase_config) 
                : w.__firebase_config;
            return initializeApp(config);
        } catch (e) {
            console.warn("AuthModal: Failed to init firebase from config", e);
            return null;
        }
    }
    return null;
};

// --- DATABASE USER SYNC ---
const saveUserToFirestore = async (user: FirebaseUser, role: UserRole, additionalData?: any) => {
    const app = getFirebaseApp();
    if (!app) return;
    
    try {
        const db = getFirestore(app);
        const userRef = doc(db, "users", user.uid);
        
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || additionalData?.name || 'Usuário',
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            createdAt: additionalData?.isNew ? serverTimestamp() : undefined,
            role: role
        }, { merge: true });
    } catch (e) {
        console.error("Error saving user to DB:", e);
    }
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onMockLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const app = getFirebaseApp();
      if (!app) {
          if (onMockLogin) {
              // Mock Google Login
              onMockLogin({
                  uid: 'mock-google-user-' + Date.now(),
                  email: 'demo@gmail.com',
                  displayName: 'Usuário Demo (Google)',
                  isAnonymous: false,
                  photoURL: null
              }, selectedRole);
              onClose();
              return;
          }
          throw new Error("Serviço de autenticação indisponível (Configuração ausente).");
      }
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      if (isRegistering) {
        provider.setCustomParameters({ prompt: 'select_account' });
      }

      const result = await signInWithPopup(auth, provider);
      // Save to DB
      await saveUserToFirestore(result.user, selectedRole);
      
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        console.log("Login canceled by user");
      } else {
        setError(err.message || "Erro ao conectar com Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
        setError("Por favor, preencha todos os campos.");
        return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const app = getFirebaseApp();
      
      // FALLBACK: MOCK LOGIN (If Firebase is missing)
      if (!app) {
          if (onMockLogin) {
              console.log("Using Mock Login for:", email);
              setTimeout(() => {
                onMockLogin({
                    uid: 'mock-user-' + Date.now(),
                    email: email,
                    displayName: name || email.split('@')[0],
                    isAnonymous: false,
                    emailVerified: true
                }, selectedRole);
                onClose();
              }, 800);
              return;
          }
          throw new Error("Serviço de autenticação indisponível (Configuração ausente).");
      }

      // REAL LOGIN (If Firebase exists)
      const auth = getAuth(app);
      
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        await saveUserToFirestore(userCredential.user, selectedRole, { isNew: true, name });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Note: In real app, we would fetch the role from DB here.
        // For simplicity, we update/ensure role on login or just rely on what's in DB.
        await saveUserToFirestore(userCredential.user, selectedRole);
      }
      onClose();
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está em uso.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Email ou senha incorretos.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(err.message || "Ocorreu um erro. Tente novamente mais tarde.");
      }
    } finally {
      if (getFirebaseApp()) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 animate-fade-in transform transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="p-8 pb-0 text-center relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-4 text-indigo-600 dark:text-indigo-400">
                <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                {isRegistering ? 'Escolha seu perfil e cadastre-se.' : 'Entre para acessar suas análises.'}
            </p>
        </div>

        <div className="p-8">
            {/* Role Selection */}
            {isRegistering && (
                <div className="mb-6 grid grid-cols-3 gap-2">
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('client')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedRole === 'client' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                    >
                        <Smile className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">Cliente</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('professional')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedRole === 'professional' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                    >
                        <Briefcase className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">Estilista</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSelectedRole('store')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedRole === 'store' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                    >
                        <ShoppingBag className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">Loja</span>
                    </button>
                </div>
            )}

            {/* Google Auth */}
            <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium text-slate-700 dark:text-slate-200 mb-6 group"
            >
                 <Chrome className="w-5 h-5 text-slate-900 dark:text-white group-hover:scale-110 transition-transform" />
                 <span>{isRegistering ? 'Cadastrar com Google' : 'Entrar com Google'}</span>
            </button>

            <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Ou via Email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
                {isRegistering && (
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Seu Nome"
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all placeholder:text-slate-400"
                            required
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="email" 
                        placeholder="seu@email.com"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all placeholder:text-slate-400"
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="password" 
                        placeholder="Sua senha"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all placeholder:text-slate-400"
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Criar Conta' : 'Entrar')}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-2 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};