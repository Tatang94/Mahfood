import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, Phone, Mail, Search } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "Bagaimana cara memesan makanan di FoodieID?",
      answer: "Anda dapat memesan makanan dengan mudah: 1) Pilih makanan dari menu yang tersedia, 2) Tambahkan ke keranjang, 3) Isi alamat pengiriman, 4) Pilih metode pembayaran, 5) Konfirmasi pesanan. Makanan akan segera disiapkan dan diantar ke lokasi Anda."
    },
    {
      question: "Berapa lama waktu pengiriman makanan?",
      answer: "Waktu pengiriman rata-rata adalah 25-35 menit tergantung jarak lokasi dan kondisi lalu lintas. Kami akan memberikan estimasi waktu yang akurat saat Anda melakukan pemesanan."
    },
    {
      question: "Apa saja metode pembayaran yang tersedia?",
      answer: "Kami menerima berbagai metode pembayaran: Bayar di Tempat (COD), Transfer Bank (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, Dana, ShopeePay), dan Kartu Kredit/Debit."
    },
    {
      question: "Bisakah saya membatalkan pesanan yang sudah dibuat?",
      answer: "Pesanan dapat dibatalkan selama makanan belum mulai disiapkan (biasanya dalam 5 menit pertama). Setelah itu, pembatalan tidak dapat dilakukan. Untuk pembatalan darurat, hubungi customer service kami."
    },
    {
      question: "Bagaimana jika makanan tidak sesuai atau ada masalah?",
      answer: "Jika ada masalah dengan pesanan Anda, silakan hubungi customer service dalam 1 jam setelah pengiriman. Kami akan mengganti makanan atau memberikan refund sesuai kebijakan kami."
    },
    {
      question: "Apakah ada minimum order untuk pengiriman?",
      answer: "Minimum order adalah Rp 25.000 untuk area dalam kota. Untuk beberapa area tertentu, minimum order mungkin berbeda. Ongkos kirim gratis untuk pesanan di atas Rp 50.000."
    },
    {
      question: "Bagaimana cara menjadi restoran partner?",
      answer: "Untuk bergabung sebagai restoran partner, silakan hubungi tim partnership kami di partnership@foodieid.com atau WhatsApp ke +62 811 1234 5678. Tim kami akan membantu proses registrasi dan setup."
    },
    {
      question: "Apakah FoodieID tersedia di kota saya?",
      answer: "Saat ini FoodieID melayani 25+ kota di Indonesia. Cek aplikasi atau website untuk melihat ketersediaan di kota Anda. Kami terus melakukan ekspansi ke kota-kota baru."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Pusat Bantuan</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan yang sering diajukan atau hubungi tim support kami
          </p>
        </div>

        {/* Search FAQ */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari bantuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
              <p className="text-gray-600 text-sm mb-4">
                Chat langsung dengan customer service
              </p>
              <Button className="w-full">Mulai Chat</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Telepon</h3>
              <p className="text-gray-600 text-sm mb-4">
                Hubungi hotline 24/7
              </p>
              <Button className="w-full" variant="outline">
                +62 21 1234 5678
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-gray-600 text-sm mb-4">
                Kirim email untuk bantuan
              </p>
              <Button className="w-full" variant="outline">
                support@foodieid.com
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pertanyaan yang Sering Diajukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Tidak ada hasil yang ditemukan untuk "{searchQuery}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Masih Butuh Bantuan?</CardTitle>
            <p className="text-gray-600">
              Kirim pesan kepada kami dan tim support akan merespons dalam 24 jam
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <Input placeholder="Masukkan nama lengkap" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="nama@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjek
                </label>
                <Input placeholder="Jelaskan masalah secara singkat" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan
                </label>
                <Textarea
                  placeholder="Jelaskan masalah Anda secara detail..."
                  rows={5}
                />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90">
                Kirim Pesan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}