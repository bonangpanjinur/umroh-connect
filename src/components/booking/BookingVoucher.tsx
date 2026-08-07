import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface BookingVoucherProps {
  bookingCode: string;
  packageName: string;
  travelName: string;
  contactName: string;
  numberOfPilgrims: number;
  departureDate?: string | null;
  returnDate?: string | null;
  status: string;
}

const formatDate = (value?: string | null) =>
  value ? format(new Date(value), 'd MMMM yyyy', { locale: idLocale }) : '-';

const BookingVoucher = ({
  bookingCode,
  packageName,
  travelName,
  contactName,
  numberOfPilgrims,
  departureDate,
  returnDate,
  status,
}: BookingVoucherProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(bookingCode, { width: 320, margin: 1 })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => setQrDataUrl(null));
    return () => {
      active = false;
    };
  }, [bookingCode]);

  const isEligible = ['confirmed', 'paid', 'completed'].includes(status);

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(20);
    doc.text('E-Voucher Umroh', 105, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.text(travelName, 105, 30, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(20, 36, 190, 36);

    const rows: [string, string][] = [
      ['Kode Booking', bookingCode],
      ['Paket', packageName],
      ['Nama Pemesan', contactName],
      ['Jumlah Jamaah', `${numberOfPilgrims} orang`],
      ['Keberangkatan', formatDate(departureDate)],
      ['Kepulangan', formatDate(returnDate)],
    ];

    let y = 48;
    doc.setFontSize(12);
    rows.forEach(([label, value]) => {
      doc.setTextColor(120);
      doc.text(label, 20, y);
      doc.setTextColor(20);
      doc.text(String(value), 80, y);
      y += 10;
    });

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 140, 44, 45, 45);
    }

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      'Tunjukkan voucher ini kepada petugas travel saat keberangkatan.',
      105,
      y + 12,
      { align: 'center' }
    );

    doc.save(`e-voucher-${bookingCode}.pdf`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          E-Voucher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEligible ? (
          <p className="text-sm text-muted-foreground">
            E-voucher tersedia setelah booking dikonfirmasi travel.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`Kode QR voucher booking ${bookingCode}`}
                  className="w-24 h-24 rounded-lg border border-border bg-background"
                />
              )}
              <div className="space-y-1 text-sm">
                <p className="font-mono font-bold text-base">{bookingCode}</p>
                <p className="text-muted-foreground">{packageName}</p>
                <p className="text-muted-foreground">{contactName}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Keberangkatan</p>
                <p className="font-medium">{formatDate(departureDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kepulangan</p>
                <p className="font-medium">{formatDate(returnDate)}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Unduh Voucher (PDF)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingVoucher;
