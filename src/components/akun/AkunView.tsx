import { User, Briefcase, Glasses, Globe, HelpCircle, LogOut, ChevronRight, Pen, LogIn, LayoutDashboard, FileText, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { useUserHajiRegistrations } from '@/hooks/useHaji';

// Haji registration button component
const HajiRegistrationButton = () => {
  const navigate = useNavigate();
  const { data: registrations } = useUserHajiRegistrations();
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  
  const activeRegistrations = registrations?.filter(r => 
    ['pending', 'verified', 'waiting'].includes(r.status)
  ) || [];

  if (activeRegistrations.length === 0) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate('/?tab=haji')}
      className={`w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between mb-3 ${
        isElderlyMode ? 'p-5' : 'p-4'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full bg-emerald-500 text-primary-foreground flex items-center justify-center ${
          isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
        }`}>
          <FileText style={{ width: iconSize.md, height: iconSize.md }} />
        </div>
        <div className="text-left">
          <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Pendaftaran Haji</h4>
          <p className={`text-muted-foreground ${fontSize.xs}`}>
            {activeRegistrations.length} pendaftaran aktif
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`bg-emerald-500 text-white font-bold rounded-full flex items-center justify-center ${
          isElderlyMode ? 'w-7 h-7 text-base' : 'w-5 h-5 text-xs'
        }`}>
          {activeRegistrations.length}
        </span>
        <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
      </div>
    </motion.button>
  );
};

const AkunView = () => {
  const { isElderlyMode, toggleElderlyMode, fontSize, iconSize } = useElderlyMode();
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
        <div className={`rounded-full bg-secondary flex items-center justify-center mb-4 ${
          isElderlyMode ? 'w-28 h-28' : 'w-20 h-20'
        }`}>
          <User style={{ width: isElderlyMode ? 56 : 40, height: isElderlyMode ? 56 : 40 }} className="text-muted-foreground" />
        </div>
        <h2 className={`font-bold text-foreground mb-2 ${fontSize.xl}`}>Belum Login</h2>
        <p className={`text-muted-foreground mb-6 ${fontSize.sm}`}>
          Masuk untuk menyimpan progress ibadah dan melihat paket favorit
        </p>
        <Button 
          onClick={() => navigate('/auth')} 
          className={`gap-2 ${isElderlyMode ? 'h-14 px-8 text-lg' : ''}`}
        >
          <LogIn style={{ width: iconSize.sm, height: iconSize.sm }} /> 
          Masuk / Daftar
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
      {/* Elderly Mode Active Banner */}
      {isElderlyMode && (
        <div className="bg-primary/10 border-b-2 border-primary p-4 flex items-center justify-center gap-3">
          <Volume2 className="w-6 h-6 text-primary" />
          <span className={`font-semibold text-primary ${fontSize.sm}`}>
            Mode Lansia Aktif - Teks Diperbesar
          </span>
        </div>
      )}

      {/* Profile Header */}
      <div className={`bg-card border-b border-border ${isElderlyMode ? 'pb-8 pt-6 px-5' : 'pb-6 pt-4 px-4'}`}>
        <div className={`flex items-center mb-6 ${isElderlyMode ? 'gap-5' : 'gap-4'}`}>
          <div className={`rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground border-2 border-card shadow-primary ${
            isElderlyMode ? 'w-24 h-24 text-4xl' : 'w-16 h-16 text-2xl'
          }`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User style={{ width: isElderlyMode ? 48 : 28, height: isElderlyMode ? 48 : 28 }} />
            )}
          </div>
          <div className="flex-1">
            <h2 className={`font-bold text-foreground ${fontSize.lg}`}>
              {profile?.full_name || user.email?.split('@')[0] || 'Pengguna'}
            </h2>
            <p className={`text-muted-foreground ${fontSize.sm}`}>
              {profile?.role === 'agent' ? 'Travel Agent' : profile?.role === 'admin' ? 'Admin' : 'Jamaah'}
              <span className="mx-1">•</span>
              <span className="text-primary font-medium">Free Plan</span>
            </p>
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors p-2">
            <Pen style={{ width: iconSize.sm, height: iconSize.sm }} />
          </button>
        </div>

        {/* Agent Dashboard Button */}
        {isAgentOrAdmin && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/agent')}
            className={`w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between mb-3 ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-blue-500 text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <LayoutDashboard style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Dashboard Agent</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>Kelola paket umroh Anda</p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        )}

        {/* Haji Registration Status Button */}
        <HajiRegistrationButton />

        {/* Admin Dashboard Button */}
        {profile?.role === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/admin')}
            className={`w-full bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-purple-500 text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <Briefcase style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Admin Dashboard</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>Kelola platform & monetisasi</p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Settings */}
      <div className={`space-y-3 ${isElderlyMode ? 'p-5' : 'p-4'}`}>
        <h3 className={`font-bold text-muted-foreground uppercase tracking-wider mb-2 ${fontSize.xs}`}>
          Pengaturan Aplikasi
        </h3>
        
        {/* Mode Lansia Toggle - Highlighted */}
        <div className={`rounded-2xl border-2 flex items-center justify-between shadow-card ${
          isElderlyMode 
            ? 'bg-primary/10 border-primary p-5' 
            : 'bg-card border-border p-4'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-full flex items-center justify-center ${
              isElderlyMode 
                ? 'w-14 h-14 bg-primary text-primary-foreground' 
                : 'w-10 h-10 bg-muted'
            }`}>
              <Glasses style={{ width: iconSize.md, height: iconSize.md }} />
            </div>
            <div>
              <span className={`font-bold text-foreground block ${fontSize.sm}`}>
                Mode Lansia
              </span>
              <span className={`text-muted-foreground ${fontSize.xs}`}>
                {isElderlyMode ? 'Aktif - Teks & tombol diperbesar' : 'Teks besar & kontras tinggi'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleElderlyMode}
            className={`rounded-full relative transition-colors duration-300 ${
              isElderlyMode 
                ? 'bg-primary w-16 h-9' 
                : 'bg-muted w-12 h-7'
            }`}
            aria-label={isElderlyMode ? 'Nonaktifkan Mode Lansia' : 'Aktifkan Mode Lansia'}
          >
            <motion.div
              animate={{ x: isElderlyMode ? 30 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`bg-card rounded-full absolute top-1 shadow-md ${
                isElderlyMode ? 'w-7 h-7' : 'w-5 h-5'
              }`}
            />
          </button>
        </div>

        {/* Language Setting */}
        <button className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
          isElderlyMode ? 'p-5' : 'p-4'
        }`}>
          <div className="flex items-center gap-3">
            <Globe style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <span className={`font-medium text-foreground ${fontSize.sm}`}>Bahasa / Language</span>
          </div>
          <span className={`text-muted-foreground flex items-center gap-1 ${fontSize.xs}`}>
            Indonesia <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} />
          </span>
        </button>

        {/* Help */}
        <button className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors mt-4 ${
          isElderlyMode ? 'p-5' : 'p-4'
        }`}>
          <div className="flex items-center gap-3">
            <HelpCircle style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <span className={`font-medium text-foreground ${fontSize.sm}`}>Bantuan & Feedback</span>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Logout */}
        <Button 
          variant="destructive" 
          onClick={handleSignOut}
          className={`w-full mt-6 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 ${
            isElderlyMode ? 'h-14 text-lg' : ''
          }`}
        >
          <LogOut style={{ width: iconSize.sm, height: iconSize.sm }} className="mr-2" />
          Keluar Aplikasi
        </Button>
      </div>
    </motion.div>
  );
};

export default AkunView;
