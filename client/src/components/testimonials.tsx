import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Sari Melati",
      location: "Jakarta",
      rating: 5,
      comment: "Makanannya selalu fresh dan pengiriman cepat! Gudeg Jogjanya enak banget, rasanya autentik.",
      avatar: "SM"
    },
    {
      id: 2,
      name: "Budi Santoso", 
      location: "Bandung",
      rating: 5,
      comment: "Pelayanan excellent, makanan sampai masih hangat. Nasi Padangnya mantap, porsi juga besar.",
      avatar: "BS"
    },
    {
      id: 3,
      name: "Dewi Lestari",
      location: "Surabaya", 
      rating: 4,
      comment: "Aplikasinya user-friendly, mudah pesan. Rawon Surabayanya juara, kuahnya pekat dan daging empuk.",
      avatar: "DL"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Apa Kata Pelanggan</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kepuasan pelanggan adalah prioritas utama kami. Lihat testimoni dari ribuan pelanggan setia FoodieID.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}