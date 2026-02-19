import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useMembershipConfig, useSaveMembershipConfig } from '@/hooks/useMembershipConfig';
import { MEMBERSHIP_PLANS, type MembershipPlan } from '@/hooks/useAgentMembership';
import { toast } from 'sonner';
import { Save, Crown, Sparkles, Shield, Loader2 } from 'lucide-react';

const TOGGLE_LIMITS: { key: keyof MembershipPlan['limits']; label: string }[] = [
  { key: 'hasWebsite', label: 'Akses Website' },
  { key: 'hasPrioritySearch', label: 'Prioritas Pencarian' },
  { key: 'hasChat', label: 'Chat Jamaah' },
  { key: 'hasLeadStats', label: 'Statistik Leads' },
  { key: 'hasVerifiedBadge', label: 'Badge Verified' },
  { key: 'hasTopListing', label: 'Top Listing' },
  { key: 'hasJamaahData', label: 'Data Jamaah' },
  { key: 'hasPrioritySupport', label: 'Support Prioritas' },
  { key: 'hasAdvancedAnalytics', label: 'Analitik Advanced' },
];

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Shield className="w-5 h-5 text-muted-foreground" />,
  pro: <Sparkles className="w-5 h-5 text-primary" />,
  premium: <Crown className="w-5 h-5 text-amber-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: '',
  pro: 'border-primary/30',
  premium: 'border-amber-500/30',
};

export const MembershipConfigPanel = () => {
  const { data: configPlans, isLoading } = useMembershipConfig();
  const saveMutation = useSaveMembershipConfig();
  const [plans, setPlans] = useState<MembershipPlan[]>(MEMBERSHIP_PLANS);

  useEffect(() => {
    if (configPlans && configPlans.length > 0) {
      setPlans(configPlans);
    }
  }, [configPlans]);

  const updatePlan = (planId: string, updates: Partial<MembershipPlan>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
  };

  const updateLimit = (planId: string, key: string, value: any) => {
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, limits: { ...p.limits, [key]: value } } : p
    ));
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(plans);
      toast.success('Konfigurasi membership berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan konfigurasi');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Konfigurasi Paket Membership
        </CardTitle>
        <CardDescription>
          Atur harga, fitur, dan batasan setiap tier membership. Perubahan akan langsung berlaku di seluruh sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['pro']} className="space-y-2">
          {plans.map((plan) => (
            <AccordionItem key={plan.id} value={plan.id} className={`border rounded-lg px-4 ${PLAN_COLORS[plan.id] || ''}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  {PLAN_ICONS[plan.id]}
                  <span className="font-semibold">{plan.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {plan.price === 0 ? 'Gratis' : `Rp ${(plan.price / 1000000).toFixed(1)} jt/bulan`}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-2 pb-4">
                {/* Price & Badge */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Harga (Rp)</Label>
                    <Input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlan(plan.id, { price: parseInt(e.target.value) || 0 })}
                      disabled={plan.id === 'free'}
                    />
                    {plan.id === 'free' && (
                      <p className="text-[10px] text-muted-foreground">Tier gratis tidak bisa diubah harganya</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Badge</Label>
                    <Input
                      value={plan.badge || ''}
                      onChange={(e) => updatePlan(plan.id, { badge: e.target.value })}
                      placeholder="contoh: Pro, Verified ✓"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <Label>Daftar Fitur (satu per baris)</Label>
                  <Textarea
                    value={plan.features.join('\n')}
                    onChange={(e) => updatePlan(plan.id, {
                      features: e.target.value.split('\n').filter(f => f.trim() !== '')
                    })}
                    rows={5}
                    placeholder="Listing 5 paket per bulan&#10;Website agent + 1 template&#10;Prioritas di pencarian"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Fitur ini tampil di card perbandingan paket
                  </p>
                </div>

                {/* Numeric Limits */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Batasan Angka</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max Listing Paket</Label>
                      <Input
                        type="number"
                        value={plan.limits.maxPackages}
                        onChange={(e) => updateLimit(plan.id, 'maxPackages', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max Template</Label>
                      <Input
                        type="number"
                        value={plan.limits.maxTemplates}
                        onChange={(e) => updateLimit(plan.id, 'maxTemplates', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Kredit Bulanan</Label>
                      <Input
                        type="number"
                        value={plan.limits.monthlyCredits}
                        onChange={(e) => updateLimit(plan.id, 'monthlyCredits', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Toggle Limits */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Batasan Fitur</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TOGGLE_LIMITS.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={!!plan.limits[key]}
                          onCheckedChange={(checked) => updateLimit(plan.id, key, checked)}
                        />
                        <Label className="text-xs cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button onClick={handleSave} className="mt-6 w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Konfigurasi Membership
        </Button>
      </CardContent>
    </Card>
  );
};
