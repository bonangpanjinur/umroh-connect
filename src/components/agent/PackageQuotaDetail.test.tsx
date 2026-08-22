import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { restoreManagementPackageDepartures, toast, invalidateQueries } = vi.hoisted(() => ({
  restoreManagementPackageDepartures: vi.fn(),
  toast: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/coreApi', () => ({
  coreApi: { restoreManagementPackageDepartures },
  CoreApiError: class CoreApiError extends Error {
    code?: string;
    requestId?: string;
    constructor(message: string, options: { code?: string; requestId?: string } = {}) {
      super(message);
      this.code = options.code;
      this.requestId = options.requestId;
    }
  },
}));
vi.mock('@/hooks/useAgentData', () => ({
  usePackageDepartures: vi.fn(() => ({
    isLoading: false,
    data: [{
      id: 'dep-cancelled', package_id: 'pkg-1', departure_date: '2099-12-01', return_date: '2099-12-10',
      price: 25000000, original_price: null, available_seats: 12, total_seats: 45,
      status: 'cancelled', created_at: '2026-01-01', updated_at: '2026-01-01',
    }],
  })),
  useUpdateDeparture: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));
vi.mock('@/hooks/useDeparturesRealtime', () => ({ useDeparturesRealtime: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({
  toast,
  useToast: () => ({ toast }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('framer-motion', () => ({ motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> } }));

import PackageQuotaDetail from './PackageQuotaDetail';

describe('PackageQuotaDetail restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restoreManagementPackageDepartures.mockResolvedValue({
      package_id: 'pkg-1', restored_count: 1, departures: [],
    });
  });

  function renderComponent() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(invalidateQueries as any);
    const pkg: any = {
      id: 'pkg-1', name: 'Paket Amanah', duration_days: 10, is_active: true,
      travel_id: 'travel-1', description: null, hotel_makkah: null, hotel_madinah: null,
      hotel_star: 4, airline: 'Test Air', flight_type: 'direct', meal_type: 'fullboard',
      facilities: [], images: [], status: 'active', package_type: 'umroh',
      created_at: '2026-01-01', updated_at: '2026-01-01',
    };
    return render(
      <QueryClientProvider client={queryClient}>
        <PackageQuotaDetail package={pkg} onClose={vi.fn()} />
      </QueryClientProvider>,
    );
  }

  it('calls Core restore command and invalidates departure query after success', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Pulihkan \(1\)/i }));

    await waitFor(() => expect(restoreManagementPackageDepartures).toHaveBeenCalledWith(
      'pkg-1',
      expect.stringContaining('Paket Amanah'),
    ));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['departures', 'pkg-1'] });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: '1 jadwal dipulihkan' }));
  });

  it('shows Core error message and does not invalidate on failure', async () => {
    restoreManagementPackageDepartures.mockRejectedValueOnce(new Error('Core unavailable'));
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Pulihkan \(1\)/i }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Gagal memulihkan jadwal',
      description: 'Core unavailable',
    })));
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
