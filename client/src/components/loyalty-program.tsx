import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Gift, Crown, Award } from "lucide-react";

export default function LoyaltyProgram() {
  const currentPoints = 1250;
  const nextTierPoints = 2000;
  const progress = (currentPoints / nextTierPoints) * 100;

  const benefits = [
    {
      tier: "Bronze",
      icon: Award,
      points: "0-999",
      benefits: ["Diskon 5% setiap pembelian", "Akses promo eksklusif"],
      color: "text-orange-600"
    },
    {
      tier: "Silver", 
      icon: Star,
      points: "1000-1999",
      benefits: ["Diskon 10% setiap pembelian", "Gratis ongkir 2x/bulan", "Birthday special"],
      color: "text-gray-600",
      current: true
    },
    {
      tier: "Gold",
      icon: Crown,
      points: "2000+",
      benefits: ["Diskon 15% setiap pembelian", "Gratis ongkir unlimited", "Priority support"],
      color: "text-yellow-600"
    }
  ];

  const rewards = [
    { points: 500, reward: "Diskon Rp 5,000", icon: "💰" },
    { points: 1000, reward: "Gratis Ongkir", icon: "🚚" },
    { points: 1500, reward: "Diskon Rp 15,000", icon: "🎁" },
    { points: 2000, reward: "Menu Gratis", icon: "🍽️" }
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Program Loyalitas FoodieID</h2>
          <p className="text-gray-600">Dapatkan poin setiap pembelian dan nikmati berbagai keuntungan eksklusif</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Status */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <CardTitle>Status Anda</CardTitle>
                <div className="text-2xl font-bold text-primary">Silver Member</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Poin Saat Ini</span>
                      <span className="font-bold">{currentPoints.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {nextTierPoints - currentPoints} poin lagi untuk Gold
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="text-sm font-medium text-primary mb-1">Keuntungan Aktif:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Diskon 10% setiap pembelian</li>
                      <li>• Gratis ongkir 2x/bulan</li>
                      <li>• Birthday special</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier Benefits */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 mb-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className={`transition-all ${
                    benefit.current ? 'ring-2 ring-primary bg-primary/5' : 'bg-white/60'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${benefit.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{benefit.tier}</h3>
                            {benefit.current && (
                              <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{benefit.points} poin</div>
                          <div className="text-sm">
                            {benefit.benefits.map((item, i) => (
                              <div key={i} className="text-gray-700">• {item}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Rewards */}
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Tukar Poin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {rewards.map((reward, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{reward.icon}</span>
                        <div>
                          <div className="font-medium">{reward.reward}</div>
                          <div className="text-sm text-gray-600">{reward.points} poin</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full" 
                        disabled={currentPoints < reward.points}
                        variant={currentPoints >= reward.points ? "default" : "outline"}
                      >
                        {currentPoints >= reward.points ? "Tukar Sekarang" : "Poin Tidak Cukup"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 mb-4">
            Dapatkan 10 poin untuk setiap Rp 1,000 yang Anda belanjakan
          </p>
          <Button className="bg-primary hover:bg-primary/90">
            Lihat Riwayat Poin
          </Button>
        </div>
      </div>
    </section>
  );
}