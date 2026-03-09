import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Email tidak valid');
const passwordSchema = z.string().min(6, 'Password minimal 6 karakter');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  const { signIn, signUp, user, roles, isAdmin, isAgent, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      if (isAdmin()) {
        navigate('/admin');
      } else if (isAgent()) {
        navigate('/agent');
      } else {
        navigate('/');
      }
    }
  }, [user, roles, authLoading, navigate]);

  const validateForm = (): boolean => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email atau password salah');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Email sudah terdaftar. Silakan login.');
          } else {
            setError(error.message);
          }
        } else {
          setSignupSuccess(true);
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col">
        {/* Header */}
        <div className="pt-12 pb-8 px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary mx-auto mb-4"
          >
            <span className="text-primary-foreground text-3xl">🕋</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-primary">Arah Umroh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Marketplace & Pendamping Ibadah
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-1 bg-card rounded-t-3xl px-6 pt-8 pb-12"
        >
          {signupSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-primary" />
              <p className="text-foreground font-semibold text-lg text-center">Akun berhasil dibuat!</p>
              <p className="text-muted-foreground text-sm text-center">
                Silakan login dengan email dan password yang sudah didaftarkan.
              </p>
              <Button onClick={() => { setSignupSuccess(false); setIsLogin(true); }} className="mt-2">
                Masuk Sekarang
              </Button>
            </div>
          ) : showForgotPassword ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2 text-center">Lupa Password</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Masukkan email Anda untuk menerima link reset password
              </p>

              {forgotSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle className="w-12 h-12 text-primary" />
                  <p className="text-foreground font-semibold text-center">Email terkirim!</p>
                  <p className="text-muted-foreground text-sm text-center">
                    Cek inbox email Anda untuk link reset password.
                  </p>
                  <Button variant="outline" onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(''); }}>
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    </motion.div>
                  )}
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input type="email" placeholder="Email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-11 h-12 rounded-xl" required />
                    </div>
                    <Button type="submit" disabled={forgotLoading} className="w-full h-12 rounded-xl text-base">
                      {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => { setShowForgotPassword(false); setError(null); }} className="text-primary font-semibold text-sm">
                      Kembali ke Login
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground mb-6 text-center">
                {isLogin ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
              </h2>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 mb-4 flex items-center gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input type="text" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-11 h-12 rounded-xl" />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl" required />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-xl" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setShowForgotPassword(true); setError(null); }} className="text-sm text-primary font-medium">
                      Lupa Password?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl shadow-primary text-base">
                  {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-primary font-semibold ml-1">
                    {isLogin ? 'Daftar' : 'Masuk'}
                  </button>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
