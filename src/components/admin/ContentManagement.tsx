import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, MapPin, Briefcase } from 'lucide-react';
import { ManasikManagement } from './ManasikManagement';
import { LocationsManagement } from './LocationsManagement';
import { PackingTemplatesManagement } from './PackingTemplatesManagement';

export const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('manasik');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Manajemen Konten</h2>
        <p className="text-muted-foreground">Kelola konten publik aplikasi</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manasik" className="gap-2">
            <Book className="h-4 w-4" />
            Panduan Manasik
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Lokasi Penting
          </TabsTrigger>
          <TabsTrigger value="packing" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Template Packing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manasik" className="mt-6">
          <ManasikManagement />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <LocationsManagement />
        </TabsContent>

        <TabsContent value="packing" className="mt-6">
          <PackingTemplatesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
