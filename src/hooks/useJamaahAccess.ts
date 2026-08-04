import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    const checkAccess = async () => {
      if (!user) {
        setHasActiveBooking(false);
        setHasConfirmedBooking(false);
        setUpcomingDeparture(null);
        setIsLoading(false);
        return;
      }

      try {
        // Check for any bookings that are still live (not cancelled)
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            paid_amount,
            departure_id,
            departures (
              departure_date,
              package_id,
              packages (
                name,
                travel_id,
                travels (name)
              )
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['pending', 'confirmed', 'paid'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error checking jamaah access:', error);
          setIsLoading(false);
          return;
        }

        const hasAny = bookings && bookings.length > 0;
        // A booking counts as confirmed once the agent confirms it, it is fully
        // paid, or the jamaah has paid at least the down payment.
        const hasConfirmed = bookings?.some(b =>
          b.status === 'confirmed' ||
          b.status === 'paid' ||
          Number(b.paid_amount ?? 0) > 0
        ) || false;


        setHasActiveBooking(hasAny);
        setHasConfirmedBooking(hasConfirmed);

        // Find upcoming departure
        if (bookings && bookings.length > 0) {
          const now = new Date();
          const upcoming = bookings.find(b => {
            const departure = b.departures as any;
            if (!departure?.departure_date) return false;
            return new Date(departure.departure_date) > now;
          });

          if (upcoming) {
            const departure = upcoming.departures as any;
            const pkg = departure?.packages as any;
            const travel = pkg?.travels as any;

            setUpcomingDeparture({
              date: departure?.departure_date,
              packageName: pkg?.name || 'Unknown Package',
              travelName: travel?.name || 'Unknown Travel',
            });
          }
        }
      } catch (err) {
        console.error('Error in useJamaahAccess:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  return {
    hasActiveBooking,
    hasConfirmedBooking,
    upcomingDeparture,
    isLoading,
  };
};

// Component wrapper for jamaah-only features
export const JamaahOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { hasActiveBooking, isLoading } = useJamaahAccess();

  if (isLoading) {
    return null;
  }

  if (!hasActiveBooking) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(React.Fragment, null, children);
};
