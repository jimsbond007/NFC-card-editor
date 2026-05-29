/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldAlert, KeyRound, Mail, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { loading } = useAuth(); // Safely unpacks now with no TypeScript errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleIdentityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userRole = data.user?.user_metadata?.role || 'student';
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication sequence failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto text-amber-400">
            <KeyRound size={24} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Identity Gateway</h2>
          <p className="text-xs text-neutral-500 font-mono">SECURE ACCESS REQUISITION</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2 font-mono">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleIdentityLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">Email Vector</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                placeholder="admin@techsystems.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-black text-neutral-400 font-mono">Access Key</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-700 transition" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={authLoading || loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2.5 rounded-lg text-xs transition uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? <Loader2 size={14} className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}