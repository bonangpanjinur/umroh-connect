import { useState } from 'react';
import { User, Briefcase, Glasses, Globe, HelpCircle, LogOut, ChevronRight, Pen, LogIn, LayoutDashboard, FileText, Volume2, ShoppingBag, Store, Bell, Moon, Sun, ImageIcon, Trash2, Check, X, ClipboardEdit, Heart, Package, Shield, ShoppingCart, CloudDownload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserHajiRegistrations } from '@/hooks/useHaji';
import { useUserBookings } from '@/hooks/useBookings';
import { useIsPremium } from '@/hooks/usePremiumSubscription';
import { useSellerProfile } from '@/hooks/useSeller';
import UserBookingsView from '@/components/booking/UserBookingsView';
import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import ThemeToggle from '@/components/settings/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import ProfileDetailForm from '@/components/akun/ProfileDetailForm';
import { supabase } from '@/integrations/supabase/client';

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
      onClick={() => navigate('/?tab=belajar')}
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

// Booking button component
const BookingButton = ({ onClick }: { onClick: () => void }) => {
  const { data: bookings } = useUserBookings();
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  
  const activeBookings = bookings?.filter(b => 
    ['pending', 'confirmed'].includes(b.status)
  ) || [];

  const pendingPayments = bookings?.reduce((acc, booking) => {
    return acc + (booking.payment_schedules?.filter(s => !s.is_paid)?.length || 0);
  }, 0) || 0;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between mb-3 ${
        isElderlyMode ? 'p-5' : 'p-4'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center ${
          isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
        }`}>
          <ShoppingBag style={{ width: iconSize.md, height: iconSize.md }} />
        </div>
        <div className="text-left">
          <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Booking Saya</h4>
          <p className={`text-muted-foreground ${fontSize.xs}`}>
            {activeBookings.length > 0 
              ? `${activeBookings.length} aktif${pendingPayments > 0 ? ` • ${pendingPayments} bayar` : ''}`
              : 'Lihat reservasi Anda'
            }
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {pendingPayments > 0 && (
          <span className={`bg-amber-500 text-white font-bold rounded-full flex items-center justify-center ${
            isElderlyMode ? 'w-7 h-7 text-base' : 'w-5 h-5 text-xs'
          }`}>
            {pendingPayments}
          </span>
        )}
        <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
      </div>
    </motion.button>
  );
};

const AkunView = () => {
  const { isElderlyMode, toggleElderlyMode, fontSize, iconSize } = useElderlyMode();
  const { user, profile, roles, signOut, loading, isShopAdmin, isSeller, isAdmin, isAgent, isJamaah } = useAuthContext();
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPremium, subscription } = useIsPremium();
  const { data: sellerProfile } = useSellerProfile();
  const [showBookings, setShowBookings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    return localStorage.getItem('prayer-card-background');
  });

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: 'Maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem('prayer-card-background', result);
      setCustomBackground(result);
      toast({ title: 'Background berhasil diubah' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    localStorage.removeItem('prayer-card-background');
    setCustomBackground(null);
    toast({ title: 'Background dihapus' });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditProfile = () => {
    setEditName(profile?.full_name || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !profile?.id) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', profile.id);
      if (error) throw error;
      toast({ title: 'Profil berhasil diperbarui' });
      setIsEditingProfile(false);
      // Force re-render by reloading auth state
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err: any) {
      toast({ title: 'Gagal memperbarui profil', description: err.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const getPlanLabel = () => {
    if (!user) return '';
    if (isPremium) return 'Premium';
    if (subscription?.status === 'pending') return 'Menunggu Verifikasi';
    return 'Free Plan';
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

  const isAgentOrAdmin = isAgent() || isAdmin();

  // Build role display labels
  const getRoleLabels = () => {
    const labelMap: Record<string, string> = {
      admin: 'Admin',
      super_admin: 'Super Admin',
      agent: 'Travel Agent',
      shop_admin: 'Admin Toko',
      seller: 'Seller',
      jamaah: 'Jamaah',
    };
    if (roles.length === 0) return 'Jamaah';
    return roles.map(r => labelMap[r] || r).join(' • ');
  };

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
          <label className={`rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground border-2 border-card shadow-primary cursor-pointer relative group ${
            isElderlyMode ? 'w-24 h-24 text-4xl' : 'w-16 h-16 text-2xl'
          }`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user?.id || !profile?.id) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast({ title: 'Maksimal 2MB', variant: 'destructive' });
                  return;
                }
                setUploadingAvatar(true);
                try {
                  const ext = file.name.split('.').pop();
                  const path = `avatars/${user.id}.${ext}`;
                  const { error: uploadErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
                  if (uploadErr) throw uploadErr;
                  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
                  const avatarUrl = urlData.publicUrl + '?t=' + Date.now();
                  await supabase.from('profiles').update({ avatar_url: avatarUrl } as any).eq('id', profile.id);
                  window.dispatchEvent(new Event('profile-updated'));
                  toast({ title: 'Foto profil diperbarui' });
                } catch (err: any) {
                  toast({ title: 'Gagal upload foto', description: err.message, variant: 'destructive' });
                } finally {
                  setUploadingAvatar(false);
                }
              }}
            />
            {uploadingAvatar ? (
              <div className="animate-spin w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User style={{ width: isElderlyMode ? 48 : 28, height: isElderlyMode ? 48 : 28 }} />
            )}
            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
          </label>
          <div className="flex-1">
            <h2 className={`font-bold text-foreground ${fontSize.lg}`}>
              {isEditingProfile ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-base"
                    placeholder="Nama lengkap"
                    autoFocus
                  />
                  <button onClick={handleSaveProfile} disabled={savingProfile} className="p-1 text-primary hover:bg-primary/10 rounded">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditingProfile(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                profile?.full_name || user.email?.split('@')[0] || 'Pengguna'
              )}
            </h2>
            <p className={`text-muted-foreground ${fontSize.sm}`}>
              {getRoleLabels()}
              <span className="mx-1">•</span>
              <span className={`font-medium ${isPremium ? 'text-amber-500' : 'text-primary'}`}>{getPlanLabel()}</span>
            </p>
          </div>
          <button onClick={handleEditProfile} className="text-muted-foreground hover:text-primary transition-colors p-2">
            <Pen style={{ width: iconSize.sm, height: iconSize.sm }} />
          </button>
        </div>


        {/* Admin Dashboard Button */}
        {isAdmin() && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/admin')}
            className={`w-full bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between mb-3 ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-red-600 text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <Shield style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Admin Dashboard</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>Kelola seluruh platform</p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        )}

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

        {/* Shop Admin Dashboard Button */}
        {(isShopAdmin() || isAdmin()) && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/shop-admin')}
            className={`w-full bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between mb-3 ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-purple-500 text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <ShoppingCart style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Shop Admin</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>Kelola toko & produk</p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        )}

        {/* Seller Dashboard Button */}
        {(isSeller() || !!sellerProfile || isAdmin()) && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/seller')}
            className={`w-full bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between mb-3 ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-orange-500 text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <Store style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Seller Center</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>
                  {sellerProfile?.shop_name || 'Kelola produk & penjualan'}
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        )}

        {/* User Booking Button */}
        <BookingButton onClick={() => setShowBookings(true)} />

        {/* Haji Registration Status Button */}
        <HajiRegistrationButton />

        {/* --- Aktivitas Saya --- */}
        <h3 className={`font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-2 ${fontSize.xs}`}>
          Aktivitas Saya
        </h3>

        {/* Shop Order History Shortcut */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/?view=shop&shopTab=orders')}
          className={`w-full bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-between mb-3 ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-pink-500 text-primary-foreground flex items-center justify-center ${
              isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
            }`}>
              <Package style={{ width: iconSize.md, height: iconSize.md }} />
            </div>
            <div className="text-left">
              <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Riwayat Pesanan</h4>
              <p className={`text-muted-foreground ${fontSize.xs}`}>Lihat status pesanan shop</p>
            </div>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </motion.button>

        {/* Wishlist Shortcut */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/?view=shop&shopTab=wishlist')}
          className={`w-full bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between mb-3 ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-red-500 text-primary-foreground flex items-center justify-center ${
              isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
            }`}>
              <Heart style={{ width: iconSize.md, height: iconSize.md }} />
            </div>
            <div className="text-left">
              <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Wishlist</h4>
              <p className={`text-muted-foreground ${fontSize.xs}`}>Produk favorit Anda</p>
            </div>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* Agent Registration CTA - only for jamaah users */}
      {isJamaah() && !isAdmin() && !isAgent() && (
        <div className={`${isElderlyMode ? 'px-5' : 'px-4'} pb-2`}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/daftar-agen')}
            className={`w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between ${
              isElderlyMode ? 'p-5' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center ${
                isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
              }`}>
                <Briefcase style={{ width: iconSize.md, height: iconSize.md }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Jadi Agen Travel</h4>
                <p className={`text-muted-foreground ${fontSize.xs}`}>Daftar & listing paket umroh Anda</p>
              </div>
            </div>
            <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
          </motion.button>
        </div>
      )}

      {/* Complete Profile Button */}
      <div className={`${isElderlyMode ? 'px-5' : 'px-4'} pb-2`}>
        <button
          onClick={() => setShowProfileDetail(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center ${
              isElderlyMode ? 'w-14 h-14' : 'w-10 h-10'
            }`}>
              <ClipboardEdit style={{ width: iconSize.md, height: iconSize.md }} />
            </div>
            <div>
              <h4 className={`font-bold text-foreground ${fontSize.sm}`}>Lengkapi Profil</h4>
              <p className={`text-muted-foreground ${fontSize.xs}`}>Alamat, paspor, kontak darurat</p>
            </div>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>
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

        {/* Notification Settings */}
        <button 
          onClick={() => setShowNotifications(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <span className={`font-medium text-foreground ${fontSize.sm}`}>Push Notification</span>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Theme Setting */}
        <button 
          onClick={() => setShowTheme(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            {resolvedTheme === 'dark' ? (
              <Moon style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            ) : (
              <Sun style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            )}
            <span className={`font-medium text-foreground ${fontSize.sm}`}>Tema Tampilan</span>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Background Setting */}
        <button 
          onClick={() => setShowBackgroundSettings(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <ImageIcon style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <div>
              <span className={`font-medium text-foreground ${fontSize.sm}`}>Background Kartu Sholat</span>
              <span className={`block text-muted-foreground ${fontSize.xs}`}>
                {customBackground ? 'Kustom' : 'Default'}
              </span>
            </div>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Language Setting */}
        <button 
          onClick={() => setShowLanguage(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <span className={`font-medium text-foreground ${fontSize.sm}`}>{t('account.language')}</span>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Offline Manager */}
        <button 
          onClick={() => navigate('/?view=offline')}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <CloudDownload style={{ width: iconSize.md, height: iconSize.md }} className="text-muted-foreground" />
            <span className={`font-medium text-foreground ${fontSize.sm}`}>Mode Offline</span>
          </div>
          <ChevronRight style={{ width: iconSize.sm, height: iconSize.sm }} className="text-muted-foreground" />
        </button>

        {/* Help */}
        <button 
          onClick={() => setShowFeedback(true)}
          className={`w-full bg-card rounded-2xl border border-border flex items-center justify-between shadow-card text-left hover:border-primary/30 transition-colors mt-4 ${
            isElderlyMode ? 'p-5' : 'p-4'
          }`}
        >
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
          {t('account.logout')}
        </Button>
      </div>

      {/* Bookings Sheet */}
      {showBookings && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowBookings(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>Booking Saya</h2>
            </div>
            <div className="p-4">
              <UserBookingsView />
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications Sheet */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>Push Notification</h2>
            </div>
            <div className="p-4">
              <PushNotificationSettings />
            </div>
          </div>
        </div>
      )}

      {/* Language Sheet */}
      {showLanguage && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowLanguage(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>{t('account.language')}</h2>
            </div>
            <div className="p-4">
              <LanguageSelector variant="list" />
            </div>
          </div>
        </div>
      )}

      {/* Theme Sheet */}
      {showTheme && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowTheme(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>Tema Tampilan</h2>
            </div>
            <div className="p-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      <FeedbackForm isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Profile Detail Sheet */}
      {showProfileDetail && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowProfileDetail(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>Lengkapi Profil</h2>
            </div>
            <ProfileDetailForm />
          </div>
        </div>
      )}

      {/* Background Settings Sheet */}
      {showBackgroundSettings && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowBackgroundSettings(false)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className={`font-bold ${fontSize.lg}`}>Background Kartu Sholat</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className={`text-muted-foreground ${fontSize.sm}`}>
                Pilih gambar kustom untuk background kartu jadwal sholat di halaman beranda.
              </p>

              {/* Preview */}
              <div className="rounded-2xl overflow-hidden h-40 relative bg-gradient-primary">
                {customBackground && (
                  <img 
                    src={customBackground} 
                    alt="Background Preview" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-primary-foreground text-center">
                    <p className="font-bold text-xl">Ashar</p>
                    <p className="text-lg">15:30</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <label className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="hidden"
                  />
                  <div className={`w-full bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity ${
                    isElderlyMode ? 'py-4 text-lg' : 'py-3'
                  }`}>
                    <ImageIcon className="w-5 h-5" />
                    Pilih Gambar
                  </div>
                </label>

                {customBackground && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRemoveBackground}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Background
                  </Button>
                )}
              </div>

              <p className={`text-muted-foreground ${fontSize.xs}`}>
                Tips: Gunakan gambar landscape dengan resolusi minimal 800x400px untuk hasil terbaik. Maksimal 5MB.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AkunView;
