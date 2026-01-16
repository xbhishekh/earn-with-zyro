import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, X, TrendingUp, Clock, ShoppingBag, Megaphone, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
}

interface Product {
  id: string;
  title: string;
  short_description: string | null;
  thumbnail_url: string | null;
  category: string;
  price: number | null;
}

const TRENDING_SEARCHES = ['Clipper', 'Gaming', 'Lifestyle', 'Tech Review', 'Fitness'];
const STORAGE_KEY = 'zyrozo-recent-searches';

export const GlobalSearchModal = ({ open, onClose }: GlobalSearchModalProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setCampaigns([]);
      setProducts([]);
      return;
    }

    setLoading(true);

    try {
      const [campaignsRes, productsRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('id, name, slug, description, thumbnail_url, category')
          .eq('status', 'active')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(10),
        supabase
          .from('marketplace_products')
          .select('id, title, short_description, thumbnail_url, category, price')
          .eq('is_active', true)
          .or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(10),
      ]);

      setCampaigns(campaignsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleResultClick = (type: 'campaign' | 'product', idOrSlug: string, name: string) => {
    saveRecentSearch(name);
    onClose();
    if (type === 'campaign') {
      navigate(`/c/${idOrSlug}`);
    } else {
      navigate(`/marketplace/${idOrSlug}`);
    }
  };

  const handleSearchSubmit = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const totalResults = campaigns.length + products.length;
  const hasResults = totalResults > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[85vh] md:max-h-[80vh]">
        {/* Search Header */}
        <div className="sticky top-0 bg-background z-10 border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns, products..."
              className="border-0 bg-transparent text-lg focus-visible:ring-0 px-0 h-auto"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          {hasResults && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-2">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="text-xs">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="text-xs">
                  Campaigns ({campaigns.length})
                </TabsTrigger>
                <TabsTrigger value="products" className="text-xs">
                  Products ({products.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[60vh]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center text-muted-foreground"
              >
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </motion.div>
            ) : query.length < 2 ? (
              // Empty State - Show trending & recent
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-6"
              >
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs h-auto py-1"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearchSubmit(term)}
                          className="rounded-full"
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((term) => (
                      <Button
                        key={term}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSearchSubmit(term)}
                        className="rounded-full"
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : !hasResults ? (
              // No Results
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or check spelling
                </p>
              </motion.div>
            ) : (
              // Results
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Campaigns */}
                {(activeTab === 'all' || activeTab === 'campaigns') && campaigns.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                      <Megaphone className="w-4 h-4" />
                      Campaigns
                    </h3>
                    <div className="space-y-2">
                      {campaigns.map((campaign: any) => (
                        <button
                          key={campaign.id}
                          onClick={() => handleResultClick('campaign', campaign.slug || campaign.id, campaign.name)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {campaign.thumbnail_url ? (
                              <img
                                src={campaign.thumbnail_url}
                                alt={campaign.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full gradient-bg flex items-center justify-center">
                                <Megaphone className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{campaign.name}</h4>
                            {campaign.category && (
                              <p className="text-xs text-muted-foreground">{campaign.category}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                      <ShoppingBag className="w-4 h-4" />
                      Products
                    </h3>
                    <div className="space-y-2">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleResultClick('product', product.id, product.title)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {product.thumbnail_url ? (
                              <img
                                src={product.thumbnail_url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full gradient-bg flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{product.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{product.category}</span>
                              {product.price !== null && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary font-medium">
                                    ${product.price}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
