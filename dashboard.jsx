import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlass, 
  Warning, 
  Eye, 
  Globe, 
  Package, 
  Funnel,
  TrendUp,
  ShieldWarning,
  Clock,
  SignOut,
  UserCircle
} from '@phosphor-icons/react';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { StatCard } from '@/components/StatCard';
import { AuthModal } from '@/components/AuthModal';
import { recallAPI, watchlistAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskClass, setSelectedRiskClass] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [watchlist, setWatchlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load watchlist when user changes
  useEffect(() => {
    if (user) {
      loadWatchlistFromBackend();
    } else {
      setWatchlist([]);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data
      const [recallsData, statsData, countriesData] = await Promise.all([
        recallAPI.getRecalls({ limit: 500 }),
        recallAPI.getStatistics(),
        recallAPI.getCountries()
      ]);
      
      setAllProducts(recallsData);
      setDisplayedProducts(recallsData);
      setStats(statsData);
      setCountries(countriesData);
      
      toast.success(`Loaded ${recallsData.length} product recalls from database`);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load product recall data');
    } finally {
      setLoading(false);
    }
  };

  const loadWatchlistFromBackend = async () => {
    if (!user) return;
    
    try {
      const watchlistData = await watchlistAPI.getWatchlist();
      setWatchlist(watchlistData);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  // Apply filters when search/filter changes
  useEffect(() => {
    const applyFilters = async () => {
      try {
        let results;
        
        if (activeTab === 'alerts') {
          // Get Class I alerts
          results = await recallAPI.getAlerts(500);
        } else if (activeTab === 'watchlist') {
          // Show watchlist items
          const watchlistData = await watchlistAPI.getWatchlist();
          const watchlistKeys = new Set(watchlistData.map(w => `${w.source}_${w.product_name}`));
          results = allProducts.filter(p => watchlistKeys.has(`${p.source}_${p.product_name}`));
        } else {
          // Apply filters to all products
          const params = { limit: 500 };
          
          if (searchQuery) {
            params.search = searchQuery;
          }
          
          if (selectedRiskClass !== 'all') {
            params.risk_class = selectedRiskClass;
          }
          
          if (selectedCountry !== 'all') {
            params.country = selectedCountry;
          }
          
          results = await recallAPI.getRecalls(params);
        }
        
        setDisplayedProducts(results);
      } catch (error) {
        console.error('Error applying filters:', error);
      }
    };

    if (!loading) {
      applyFilters();
    }
  }, [searchQuery, selectedRiskClass, selectedCountry, activeTab, loading, allProducts]);

  const handleAddToWatchlist = async (product) => {
    if (!user) {
      toast.error('Please login to use watchlist');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    const productKey = product.source + product.product_name;
    const isInWatchlist = watchlist.some(w => (w.source + w.product_name) === productKey);
    
    try {
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(product);
        const newWatchlist = watchlist.filter(w => (w.source + w.product_name) !== productKey);
        setWatchlist(newWatchlist);
        toast.success('Removed from watchlist');
      } else {
        await watchlistAPI.addToWatchlist(product);
        const newWatchlist = [...watchlist, product];
        setWatchlist(newWatchlist);
        toast.success('Added to watchlist');
      }
      
      // Reload stats to update watchlist count
      const statsData = await recallAPI.getStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const isInWatchlist = (product) => {
    const productKey = product.source + product.product_name;
    return watchlist.some(w => (w.source + w.product_name) === productKey);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">Loading recall data...</p>
          <p className="text-sm text-slate-500 mt-2">Processing datasets from multiple sources</p>
        </div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ShieldWarning className="w-7 h-7 text-white" weight="duotone" />
                  </div>
                  MedAlert AI
                </h1>
                <p className="text-base text-blue-100 mt-2 font-medium">
                  AI-Powered Global Drug & Cosmetic Recall Monitoring System
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <span className="text-sm font-bold text-white">Login</span>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-white px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                >
                  <span className="text-sm font-bold text-indigo-600">Sign Up</span>
                </button>
                <div className="bg-green-400 px-4 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-bold text-green-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-900 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Landing Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 mb-6">
              Monitor Global Product Recalls
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Protect Your Health
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Access real-time pharmaceutical and cosmetic safety alerts from global regulatory databases. 
              Stay informed about product recalls and protect yourself and your loved ones.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:bg-slate-50 transition-all shadow-lg border-2 border-indigo-200"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <Warning className="w-8 h-8 text-white" weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Alerts</h3>
              <p className="text-slate-600">
                Get instant notifications about high-risk product recalls from 26 countries worldwide.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-white" weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Personal Watchlist</h3>
              <p className="text-slate-600">
                Create and manage your personalized watchlist of products you care about.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <ShieldWarning className="w-8 h-8 text-white" weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600">
                AI-powered risk assessment and safety recommendations for each recall.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  4,750+
                </p>
                <p className="text-slate-600 font-semibold">Product Recalls</p>
              </div>
              <div>
                <p className="text-4xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  103
                </p>
                <p className="text-slate-600 font-semibold">High Risk Alerts</p>
              </div>
              <div>
                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  26
                </p>
                <p className="text-slate-600 font-semibold">Countries Covered</p>
              </div>
              <div>
                <p className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  24/7
                </p>
                <p className="text-slate-600 font-semibold">Live Monitoring</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 shadow-2xl">
              <h3 className="text-3xl font-black text-white mb-4">
                Ready to Stay Safe?
              </h3>
              <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of users monitoring product safety. Create your free account now.
              </p>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ShieldWarning className="w-7 h-7 text-white" weight="duotone" />
                </div>
                MedAlert AI
              </h1>
              <p className="text-base text-blue-100 mt-2 font-medium">
                AI-Powered Global Drug & Cosmetic Recall Monitoring System
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-white" weight="duotone" />
                    <span className="text-sm font-bold text-white">{user.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    <SignOut className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-xl hover:bg-white/30 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="bg-white px-6 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    <span className="text-sm font-bold text-indigo-600">Sign Up</span>
                  </button>
                </>
              )}
              <div className="bg-green-400 px-4 py-2 rounded-full shadow-lg">
                <span className="text-xs font-bold text-green-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-900 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-blue-50 max-w-3xl">
            This system integrates global recall datasets and uses AI-driven logic to identify 
            and prioritize safety risks across pharmaceutical and cosmetic products.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total Recalls" 
              value={stats.total} 
              icon={Package}
            />
            <StatCard 
              title="High Risk" 
              value={stats.classI} 
              icon={ShieldWarning}
              className="border-red-200"
            />
            <StatCard 
              title="Countries" 
              value={stats.countriesCount} 
              icon={Globe}
            />
            <StatCard 
              title="Watchlist" 
              value={watchlist.length} 
              icon={Eye}
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400" />
              <input
                data-testid="search-input"
                type="text"
                placeholder="Search by product name, brand, ingredient, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-14 pr-4 border-2 border-indigo-200 rounded-xl text-base focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition-all bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Funnel className="w-4 h-4" />
                Risk Class
              </label>
              <select
                data-testid="risk-class-filter"
                value={selectedRiskClass}
                onChange={(e) => setSelectedRiskClass(e.target.value)}
                className="w-full h-12 px-4 border-2 border-indigo-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 bg-white font-medium"
              >
                <option value="all">All Classes</option>
                <option value="Class I">Class I - High Risk</option>
                <option value="Class II">Class II - Medium Risk</option>
                <option value="Class III">Class III - Low Risk</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Country
              </label>
              <select
                data-testid="country-filter"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-12 px-4 border-2 border-indigo-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 bg-white font-medium"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            data-testid="tab-all"
            onClick={() => setActiveTab('all')}
            className={`px-8 py-4 text-sm font-bold transition-all rounded-xl ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-300'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All Recalls ({displayedProducts.length})
          </button>
          <button
            data-testid="tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`px-8 py-4 text-sm font-bold transition-all rounded-xl flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-red-300'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Warning className="w-4 h-4" weight="duotone" />
            Latest Alerts ({stats?.classI || 0})
          </button>
          <button
            data-testid="tab-watchlist"
            onClick={() => setActiveTab('watchlist')}
            className={`px-8 py-4 text-sm font-bold transition-all rounded-xl flex items-center gap-2 ${
              activeTab === 'watchlist'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-300'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" weight="duotone" />
            Watchlist ({watchlist.length})
          </button>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold text-slate-900">{displayedProducts.length}</span> results
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-lg">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
            <p className="text-sm text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product, index) => (
              <ProductCard
                key={`${product.source}-${product.product_name}-${index}`}
                product={product}
                onAddToWatchlist={handleAddToWatchlist}
                isInWatchlist={isInWatchlist(product)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseModal}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}


