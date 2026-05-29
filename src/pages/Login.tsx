import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // This automatically listens for when the user clicks the Magic Link in their email
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/student');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Domain restriction check
    if (!email.endsWith('@bicol-u.edu.ph')) {
      setMessage('Error: You must use a valid @bicol-u.edu.ph email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Success! Check your BU email and click the secure link to log in.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-tech-orange">
        <div className="p-8 text-center bg-tech-black text-white">
          <h1 className="text-2xl font-bold tracking-wide">Techsystems</h1>
          <p className="text-tech-pink text-sm mt-1">NFC Card Customizer</p>
        </div>

        <div className="p-8">
          {message && (
            <div className={`p-3 text-sm font-medium rounded-lg mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSendMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BU Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@bicol-u.edu.ph"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tech-orange focus:border-transparent outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tech-orange text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Magic Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}