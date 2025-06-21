import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Star,
  Package,
  Users,
  Settings,
  Database,
  Trash2,
  Eye,
  Shield,
  Globe,
  BarChart3,
  FileText,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real data
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users")
  });

  const { data: restaurants } = useQuery({
    queryKey: ["/api/restaurants"],
    queryFn: () => apiRequest("/api/restaurants")
  });

  const { data: drivers } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: () => apiRequest("/api/drivers")
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => apiRequest("/api/orders")
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories")
  });

  const { data: foodItems } = useQuery({
    queryKey: ["/api/food-items"],
    queryFn: () => apiRequest("/api/food-items")
  });

  // Calculate real stats
  const todayOrders = orders?.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt || new Date()).toDateString() === today;
  }).length || 0;

  const todayRevenue = orders?.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt || new Date()).toDateString() === today;
  }).reduce((sum, order) => sum + order.totalAmount, 0) || 0;

  const activeUsers = users?.filter(user => user.role === 'customer').length || 0;
  const activeRestaurants = restaurants?.filter(restaurant => restaurant.isActive).length || 0;

  const stats = [
    {
      title: "Total Pengguna",
      value: activeUsers,
      change: `${users?.length || 0} total`,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Pesanan Hari Ini",
      value: todayOrders,
      change: `Rp ${todayRevenue.toLocaleString('id-ID')}`,
      icon: ShoppingBag,
      color: "text-green-600"
    },
    {
      title: "Restoran Aktif",
      value: activeRestaurants,
      change: `${restaurants?.length || 0} total`,
      icon: Package,
      color: "text-purple-600"
    },
    {
      title: "Driver Online",
      value: drivers?.filter(d => d.isOnline).length || 0,
      change: `${drivers?.length || 0} total`,
      icon: Star,
      color: "text-yellow-600"
    }
  ];

  // Mutations for admin actions
  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated successfully" });
    }
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/admin/restaurants/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Restaurant updated successfully" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (category: any) =>
      apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(category),
        headers: { "Content-Type": "application/json" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted successfully" });
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { variant: "default" as const, label: "Selesai", color: "bg-green-500" },
      ready: { variant: "secondary" as const, label: "Siap", color: "bg-blue-500" },
      preparing: { variant: "outline" as const, label: "Diproses", color: "bg-yellow-500" },
      cancelled: { variant: "destructive" as const, label: "Dibatalkan", color: "bg-red-500" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparing;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Kontrol penuh sistem FoodieID - Kelola pengguna, restoran, dan pengaturan website</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="restaurants">Restoran</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database Status</span>
                    <Badge variant="default" className="bg-green-500">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Services</span>
                    <Badge variant="default" className="bg-green-500">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Gateway</span>
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WebSocket</span>
                    <Badge variant="default" className="bg-green-500">Connected</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">New restaurant registered</p>
                      <p className="text-gray-500">Pizza Corner - 2 min ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Order completed</p>
                      <p className="text-gray-500">Order #ORD-0012 - 5 min ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">New user registered</p>
                      <p className="text-gray-500">demo@test.com - 10 min ago</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Driver went online</p>
                      <p className="text-gray-500">Driver ID: 2 - 15 min ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setActiveTab("users")}>
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("restaurants")}>
                    <Package className="w-4 h-4 mr-2" />
                    Manage Restaurants
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("content")}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Content
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("settings")}>
                    <Globe className="w-4 h-4 mr-2" />
                    Website Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Charts & Analytics Preview */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Orders Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 flex items-end justify-between space-x-2">
                    {[12, 19, 15, 27, 18, 22, 25].map((height, i) => (
                      <div key={i} className="bg-primary rounded-t flex-1" style={{ height: `${height * 2}px` }}></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Restaurants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {restaurants?.slice(0, 3).map((restaurant, index) => (
                      <div key={restaurant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{restaurant.name}</p>
                            <p className="text-xs text-gray-500">{restaurant.rating}/5.0 rating</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{restaurant.totalOrders || 0} orders</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt || Date.now()).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Management */}
          <TabsContent value="restaurants">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Restaurant Management</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restaurant
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurants?.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell className="font-medium">{restaurant.name}</TableCell>
                        <TableCell>User #{restaurant.userId}</TableCell>
                        <TableCell>
                          <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                            {restaurant.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            {restaurant.rating}
                          </div>
                        </TableCell>
                        <TableCell>{restaurant.totalOrders || 0}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Management */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">ORD-{order.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell>Customer #{order.customerId}</TableCell>
                        <TableCell>Restaurant #{order.restaurantId}</TableCell>
                        <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.createdAt || Date.now()).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Categories Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Categories</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories?.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Food Items Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Food Items</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {foodItems?.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                          <p className="text-xs text-gray-500">Restaurant #{item.restaurantId}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Promotions Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Promotions</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Promo
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Gratis Ongkir Hari Ini</h4>
                        <Switch defaultChecked />
                      </div>
                      <p className="text-sm text-gray-500">Discount: 100% | Code: GRATISONGKIR</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Diskon Weekend</h4>
                        <Switch defaultChecked />
                      </div>
                      <p className="text-sm text-gray-500">Discount: 30% | Code: WEEKEND30</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Website Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Website Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="hero-title">Hero Section Title</Label>
                    <Input id="hero-title" defaultValue="Makanan Favorit Diantar Cepat" />
                  </div>
                  <div>
                    <Label htmlFor="hero-subtitle">Hero Section Subtitle</Label>
                    <Textarea id="hero-subtitle" defaultValue="Pesan makanan lezat dari restoran terbaik di Indonesia. Pengiriman dalam 30 menit atau gratis!" />
                  </div>
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="FoodieID" />
                  </div>
                  <Button className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Content
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Put website in maintenance mode</p>
                    </div>
                    <Switch id="maintenance" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <Switch id="registration" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Push Notifications</Label>
                      <p className="text-sm text-gray-500">Enable push notifications</p>
                    </div>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-fee">Default Delivery Fee</Label>
                    <Input id="delivery-fee" type="number" defaultValue="5000" />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-time">Estimated Delivery Time (minutes)</Label>
                    <Input id="delivery-time" type="number" defaultValue="30" />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cod">Cash on Delivery</Label>
                      <p className="text-sm text-gray-500">Enable COD payments</p>
                    </div>
                    <Switch id="cod" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="taspay">TasPay Wallet</Label>
                      <p className="text-sm text-gray-500">Enable TasPay digital wallet</p>
                    </div>
                    <Switch id="taspay" defaultChecked />
                  </div>
                  
                  <div>
                    <Label htmlFor="min-order">Minimum Order Amount</Label>
                    <Input id="min-order" type="number" defaultValue="15000" />
                  </div>
                  
                  <div>
                    <Label htmlFor="free-delivery">Free Delivery Threshold</Label>
                    <Input id="free-delivery" type="number" defaultValue="50000" />
                  </div>
                </CardContent>
              </Card>

              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Email & Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" placeholder="smtp.gmail.com" />
                  </div>
                  
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" type="number" defaultValue="587" />
                  </div>
                  
                  <div>
                    <Label htmlFor="from-email">From Email</Label>
                    <Input id="from-email" placeholder="noreply@foodieid.com" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send order confirmations via email</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                    <Input id="session-timeout" type="number" defaultValue="24" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="login-attempts">Rate Limiting</Label>
                      <p className="text-sm text-gray-500">Limit login attempts</p>
                    </div>
                    <Switch id="login-attempts" defaultChecked />
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Reset All Admin Passwords
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Management */}
          <TabsContent value="system">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Database Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{users?.length || 0}</div>
                      <div className="text-sm text-blue-600">Total Users</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{orders?.length || 0}</div>
                      <div className="text-sm text-green-600">Total Orders</div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Optimize Database
                  </Button>
                  
                  <Button className="w-full" variant="destructive">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reset Database
                  </Button>
                </CardContent>
              </Card>

              {/* System Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    System Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">INFO</span>
                        <span className="text-gray-500">5:05:25 AM</span>
                      </div>
                      <p className="text-gray-600">Application started successfully</p>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">INFO</span>
                        <span className="text-gray-500">5:02:50 AM</span>
                      </div>
                      <p className="text-gray-600">Database connection established</p>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">WARN</span>
                        <span className="text-gray-500">5:00:25 AM</span>
                      </div>
                      <p className="text-gray-600">Browserslist data is 8 months old</p>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">INFO</span>
                        <span className="text-gray-500">4:56:30 AM</span>
                      </div>
                      <p className="text-gray-600">New order created: ORD-0001</p>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Full Logs
                  </Button>
                </CardContent>
              </Card>

              {/* API Management */}
              <Card>
                <CardHeader>
                  <CardTitle>API Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>API Rate Limiting</span>
                    <Switch defaultChecked />
                  </div>
                  
                  <div>
                    <Label htmlFor="api-key">Master API Key</Label>
                    <div className="flex gap-2">
                      <Input id="api-key" type="password" defaultValue="sk_test_..." readOnly />
                      <Button size="sm" variant="outline">Regenerate</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>API Endpoints Status</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">/api/users</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">/api/orders</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">/api/restaurants</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cache Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Cache & Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">85%</div>
                      <div className="text-sm text-purple-600">Cache Hit Rate</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">120ms</div>
                      <div className="text-sm text-orange-600">Avg Response</div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear All Cache
                  </Button>
                  
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Performance Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}