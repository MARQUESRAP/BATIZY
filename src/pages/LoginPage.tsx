import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores';
import { OnlineStatusBadge } from '../components/shared';

// Composant Logo Batizy avec gradient
function BatizyLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  const textSize = size === 'large' ? 'text-5xl' : 'text-2xl';
  const izySize = size === 'large' ? 'text-6xl' : 'text-3xl';
  
  return (
    <div className="flex items-baseline justify-center gap-1">
      <span className={`font-display ${textSize} font-bold text-white`}>Bat</span>
      <span 
        className={`font-display ${izySize} font-black`}
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #f97316 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        izy
      </span>
    </div>
  );
}

export function LoginPage() {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/tech');
    }
  }, [isAuthenticated, user, navigate]);

  // Focus le premier input au chargement
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Accepter uniquement les chiffres
    const sanitized = value.replace(/[^0-9]/g, '');
    if (!sanitized && value) return;
    
    const newCode = [...code];
    newCode[index] = sanitized.slice(-1);
    setCode(newCode);
    setError('');
    
    if (sanitized && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit quand tous les champs sont remplis
    const fullCode = newCode.join('');
    if (fullCode.length === 4 && newCode.every(c => c !== '')) {
      handleSubmit(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const finalCode = codeString || code.join('');
    if (finalCode.length !== 4) {
      setError('Entrez votre code à 4 chiffres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await login(finalCode);
      if (!success) {
        setError('Code incorrect');
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Pattern de fond */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Status en ligne */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
          <OnlineStatusBadge />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Logo - CENTRÉ */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="mb-4 flex justify-center">
              <BatizyLogo size="large" />
            </div>
            <p className="text-blue-300 text-lg">Gestion de chantier facile</p>
          </div>

          {/* Card de connexion */}
          <div className="card animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-gray-800 text-center mb-6">
              Entrez votre code
            </h2>

            {/* Inputs pour le code (4 chiffres) */}
            <div className="flex justify-center gap-3 mb-6">
              {code.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className={`w-14 h-16 text-center text-2xl font-display font-bold bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 ${error ? 'border-red-500 shake' : 'border-gray-200'} ${loading ? 'opacity-50' : ''}`}
                />
              ))}
            </div>

            {error && (
              <div className="text-center mb-4">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit()}
              disabled={loading || code.some(c => c === '')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" />Connexion...</>
              ) : (
                'Se connecter'
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Utilisez le code fourni par votre administrateur
            </p>
          </div>

          {/* Codes de démo */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <p className="text-blue-200 text-sm text-center mb-3">Codes de démo :</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-white text-sm font-mono">0000 (Admin)</span>
              <span className="px-3 py-1.5 bg-white/20 rounded-full text-white text-sm font-mono">1234 (Tech)</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-blue-300/60 text-sm relative z-10">
        © 2024 Batizy • Gralt.fr
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
