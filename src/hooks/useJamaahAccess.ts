import React, { useState, useEffect } from 'react';
import { coreApi } from '@/lib/coreApi';
import { useAuthContext } from '@/contexts/AuthContext';

interface JamaahAccess {
  hasActiveBooking: boolean;
  hasConfirmedBooking: boolean;
  upcomingDeparture: {
    date: string;
    packageName: string;
    travelName: string;
  } | null;
  isLoading: boolean;
}

export const useJamaahAccess = (): JamaahAccess => {
  const { user } = useAuthContext();
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [upcomingDeparture, setUpcomingDeparture] = useState<JamaahAccess['upcomingDeparture']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAccess = async () => {
      if (!user) {
        setHasActiveBooking(false);
        setHasConfirmedBooking(false);
        setUpcomingDeparture(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const bookings = await coreApi.getMyBookings() as Array<Record<string, any>>;
        if (cancelled) return;
        const live = bookings.filter((booking) => ['pending', 'confirmed', 'paid', 'processing', 'completed'].includes(String(booking.status ?? booking.booking_status)));
        const hasConfirmed = live.some((booking) => ['confirmed', 'paid', 'completed'].includes(String(booking.status ?? booking.booking_status)) || Number(booking.paid_amount ?? 0) > 0);
        setHasActiveBooking(live.length > 0);
        setHasConfirmedBooking(hasConfirmed);

        const now = Date.now();
        const upcoming = live
          .filter((booking) => {
            const departureDate = booking.departure?.departure_date ?? booking.departure_date;
            return departureDate && new Date(departureDate).getTime() > now;
          })
          .sort((a, b) => new Date(String(a.departure?.departure_date ?? a.departure_date)).getTime() - new Date(String(b.departure?.departure_date ?? b.departure_date)).getTime())[0];
        const departureDate = upcoming?.departure?.departure_date ?? upcoming?.departure_date;
        if (upcoming && departureDate) {
          setUpcomingDeparture({
            date: String(departureDate),
            packageName: String(upcoming.package?.name ?? upcoming.package_name ?? 'Unknown Package'),
            travelName: String(upcoming.travel?.name ?? upcoming.travel_name ?? 'Unknown Travel'),
          });
        } else {
          setUpcomingDeparture(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error checking jamaah access:', err);
          setHasActiveBooking(false);
          setHasConfirmedBooking(false);
          setUpcomingDeparture(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void checkAccess();
    return () => { cancelled = true; };
  }, [user]);

  return { hasActiveBooking, hasConfirmedBooking, upcomingDeparture, isLoading };
};

export const JamaahOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { hasActiveBooking, isLoading } = useJamaahAccess();
  if (isLoading) return null;
  if (!hasActiveBooking) return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  return React.createElement(React.Fragment, null, children);
};
