import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Info } from 'lucide-react';
import { HajiRegistrationList } from './HajiRegistrationList';
import { HajiChecklistDisplay } from './HajiChecklistDisplay';
import { HajiSeasonInfo } from './HajiSeasonInfo';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const HajiView = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('registrations');

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
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Login Diperlukan</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Silakan login untuk melihat status pendaftaran haji Anda
        </p>
        <Button onClick={() => navigate('/auth')} className="gap-2">
          <LogIn className="w-4 h-4" /> Masuk / Daftar
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Header */}
      <div className="bg-card p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Pendaftaran Haji</h1>
        <p className="text-sm text-muted-foreground">
          Kelola pendaftaran dan pantau status haji Anda
        </p>
      </div>

      {/* Season Info */}
      <div className="p-4">
        <HajiSeasonInfo />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="registrations" className="gap-2">
            <FileText className="w-4 h-4" />
            Pendaftaran
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-0">
          <HajiRegistrationList />
        </TabsContent>

        <TabsContent value="checklist" className="mt-0">
          <HajiChecklistDisplay />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default HajiView;
