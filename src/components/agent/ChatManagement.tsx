import { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatView } from '@/components/chat/ChatView';
import { useAgentTravel } from '@/hooks/useAgentData';
import { useAgentBookings } from '@/hooks/useBookings';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const ChatManagement = () => {
  const { data: travel, isLoading: travelLoading } = useAgentTravel();
  const { data: bookings, isLoading: bookingsLoading } = useAgentBookings(travel?.id);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null | undefined>(undefined);
  const isMobile = useIsMobile();

  if (travelLoading || bookingsLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!travel) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        Travel tidak ditemukan
      </div>
    );
  }

  const bookingsList = bookings?.map(b => ({
    id: b.id,
    booking_code: b.booking_code,
    contact_name: b.contact_name,
  })) || [];

  // Mobile view - show either list or chat
  if (isMobile) {
    if (selectedBookingId !== undefined) {
      const booking = bookingsList.find(b => b.id === selectedBookingId);
      return (
        <div className="h-[calc(100vh-200px)]">
          <ChatView
            bookingId={selectedBookingId}
            travelId={travel.id}
            travelName={booking?.contact_name || 'General Chat'}
            senderType="agent"
            onBack={() => setSelectedBookingId(undefined)}
          />
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-200px)]">
        <ChatList
          travelId={travel.id}
          bookings={bookingsList}
          onSelectChat={setSelectedBookingId}
        />
      </div>
    );
  }

  // Desktop view - side by side
  return (
    <div className="grid grid-cols-3 gap-4 h-[600px]">
      <div className="col-span-1">
        <ChatList
          travelId={travel.id}
          bookings={bookingsList}
          onSelectChat={setSelectedBookingId}
        />
      </div>
      <div className="col-span-2">
        {selectedBookingId !== undefined ? (
          <ChatView
            bookingId={selectedBookingId}
            travelId={travel.id}
            travelName={bookingsList.find(b => b.id === selectedBookingId)?.contact_name || 'General Chat'}
            senderType="agent"
          />
        ) : (
          <div className="h-full flex items-center justify-center border rounded-lg bg-muted/20 text-muted-foreground">
            Pilih percakapan untuk memulai chat
          </div>
        )}
      </div>
    </div>
  );
};
