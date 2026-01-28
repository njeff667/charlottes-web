import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Store from './pages/Store';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminInventory from './pages/admin/Inventory';
import AdminListings from './pages/admin/Listings';
import AdminNotifications from './pages/admin/Notifications';
import AdminPlatforms from './pages/admin/Platforms';
import Login from './pages/Login';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="store" element={<Store />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="admin">
              <Route index element={<AdminDashboard />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="platforms" element={<AdminPlatforms />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;