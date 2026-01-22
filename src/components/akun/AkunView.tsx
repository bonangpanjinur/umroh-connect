import { User, Briefcase, Glasses, Globe, HelpCircle, LogOut, ChevronRight, Pen, LogIn, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

const AkunView = () => {
  const [isLansiaMode, setIsLansiaMode] = useState(false);
  const { user, profile, signOut, loading } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Belum Login</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Masuk untuk menyimpan progress ibadah dan melihat paket favorit
        </p>
        <Button onClick={() => navigate('/auth')} className="gap-2">
          <LogIn className="w-4 h-4" /> Masuk / Daftar
        </Button>
      </motion.div>
    );
  }

  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Profile Header */}
      <div className="bg-card pb-6 pt-4 px-4 border-b border-border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl border-2 border-card shadow-primary">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl text-foreground">
              {profile?.full_name || user.email?.split('@')[0] || 'Pengguna'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.role === 'agent' ? 'Travel Agent' : profile?.role === 'admin' ? 'Admin' : 'Jamaah'}
              <span className="mx-1">•</span>
              <span className="text-primary font-medium">Free Plan</span>
            </p>
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Pen className="w-4 h-4" />
          </button>
        </div>

        {/* Agent Dashboard Button */}
        {isAgentOrAdmin && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/agent')}
            className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-primary-foreground flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-foreground">Dashboard Agent</h4>
                <p className="text-[11px] text-muted-foreground">Kelola paket umroh Anda</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Pengaturan Aplikasi
        </h3>
        
        {/* Mode Lansia Toggle */}
        <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <Glasses className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Mode Lansia (Teks Besar)</span>
          </div>
          <button
            onClick={() => setIsLansiaMode(!isLansiaMode)}
            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
              isLansiaMode ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <motion.div
              animate={{ x: isLansiaMode ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 bg-card rounded-full absolute top-1 shadow-md"
            />
          </button>
        </div>

        {/* Language Setting */}
        <button className="w-full bg-card p-4 rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Bahasa / Language</span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Indonesia <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Help */}
        <button className="w-full bg-card p-4 rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors mt-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Bantuan & Feedback</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Logout */}
        <Button 
          variant="destructive" 
          onClick={handleSignOut}
          className="w-full mt-6 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar Aplikasi
        </Button>
      </div>
    </motion.div>
  );
};

export default AkunView;
