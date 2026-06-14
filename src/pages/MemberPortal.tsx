import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, FileText, Link as LinkIcon, Video, 
  Youtube, Radio, Code, Download, Lock, ChevronRight,
  Loader2, CheckCircle, Eye, BookOpen, Folder, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/landing/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import DOMPurify from "dompurify";

const sanitizeEmbed = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["iframe", "div", "span", "p", "br", "a", "img"],
    ALLOWED_ATTR: [
      "src", "width", "height", "frameborder", "allow", "allowfullscreen",
      "title", "class", "style", "href", "target", "rel", "alt", "loading",
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });

const sanitizeText = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "a", "blockquote", "code", "pre", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });

interface ContentModule {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  items: ContentItem[];
}

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_data: {
    url?: string;
    embed_code?: string;
    text_content?: string;
    file_size?: number;
    duration?: string;
    youtube_id?: string;
  } | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_free_preview: boolean;
  module_id: string | null;
}

interface Product {
  id: string;
  title: string;
  thumbnail_url: string | null;
  category: string;
  seller_id: string;
}

interface Seller {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const CONTENT_TYPE_ICONS: Record<string, typeof Play> = {
  text: FileText,
  video: Video,
  file: Download,
  link: LinkIcon,
  youtube: Youtube,
  livestream: Radio,
  embed: Code,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  text: "Article",
  video: "Video",
  file: "Download",
  link: "Link",
  youtube: "YouTube",
  livestream: "Live Stream",
  embed: "Embed",
};

const MemberPortal = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [standaloneItems, setStandaloneItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (productId && user) {
      checkAccessAndFetchContent();
    } else if (!user) {
      navigate("/auth");
    }
  }, [productId, user]);

  const checkAccessAndFetchContent = async () => {
    if (!user || !productId) return;

    setLoading(true);

    // Fetch product
    let query = supabase.from("marketplace_products").select("*");
    if (productId?.includes("-")) {
      query = query.eq("slug", productId);
    } else {
      query = query.eq("id", productId);
    }
    
    const { data: productData, error: productError } = await query.single();

    if (productError || !productData) {
      toast.error("Product not found");
      navigate("/marketplace");
      return;
    }

    setProduct(productData);

    // Check if user is seller or has purchased
    const isSeller = productData.seller_id === user.id;
    
    if (!isSeller) {
      const { data: purchase } = await supabase
        .from("product_purchases")
        .select("id")
        .eq("product_id", productData.id)
        .eq("buyer_id", user.id)
        .eq("status", "completed")
        .single();

      if (!purchase) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
    }

    setHasAccess(true);

    // Fetch seller, modules and items in parallel
    const [sellerResult, modulesResult, itemsResult] = await Promise.all([
      supabase.from("profiles").select("display_name, username, avatar_url")
        .eq("user_id", productData.seller_id).single(),
      supabase.from("product_content_modules")
        .select("*")
        .eq("product_id", productData.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
      supabase.from("product_content_items")
        .select("*")
        .eq("product_id", productData.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
    ]);

    if (sellerResult.data) setSeller(sellerResult.data);

    // Organize content by modules
    const moduleMap = new Map<string, ContentModule>();
    const standalone: ContentItem[] = [];

    if (modulesResult.data) {
      modulesResult.data.forEach(mod => {
        moduleMap.set(mod.id, { ...mod, items: [] });
      });
    }

    if (itemsResult.data) {
      itemsResult.data.forEach(item => {
        const contentItem: ContentItem = {
          ...item,
          content_data: item.content_data as ContentItem['content_data']
        };
        
        if (item.module_id && moduleMap.has(item.module_id)) {
          moduleMap.get(item.module_id)!.items.push(contentItem);
        } else {
          standalone.push(contentItem);
        }
      });
    }

    setModules(Array.from(moduleMap.values()));
    setStandaloneItems(standalone);
    
    // Auto-select first item
    const allItems = [...standalone, ...Array.from(moduleMap.values()).flatMap(m => m.items)];
    if (allItems.length > 0) {
      setSelectedItem(allItems[0]);
    }

    setLoading(false);
  };

  const logAccess = async (itemId: string) => {
    if (!user) return;
    await supabase.from("content_access_logs").insert({
      content_item_id: itemId,
      user_id: user.id
    });
  };

  const selectItem = (item: ContentItem) => {
    setSelectedItem(item);
    logAccess(item.id);
  };

  const getContentIcon = (type: string) => {
    const Icon = CONTENT_TYPE_ICONS[type] || FileText;
    return Icon;
  };

  const renderContent = () => {
    if (!selectedItem) return null;

    const data = selectedItem.content_data;

    switch (selectedItem.content_type) {
      case "youtube":
        const youtubeId = data?.youtube_id || extractYoutubeId(data?.url || "");
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case "video":
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <video
              src={data?.url}
              controls
              className="w-full h-full"
              poster={selectedItem.thumbnail_url || undefined}
            />
          </div>
        );

      case "livestream":
        if (data?.embed_code) {
          return (
            <div 
              className="aspect-video w-full rounded-lg overflow-hidden bg-black"
              dangerouslySetInnerHTML={{ __html: sanitizeEmbed(data.embed_code) }}
            />
          );
        }
        return (
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex flex-col items-center justify-center">
            <Radio className="w-16 h-16 text-red-500 animate-pulse mb-4" />
            <p className="text-lg font-semibold">Live Stream</p>
            {data?.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer">
                <Button className="mt-4" variant="destructive">
                  <Radio className="w-4 h-4 mr-2" />
                  Watch Live
                </Button>
              </a>
            )}
          </div>
        );

      case "embed":
        return (
          <div 
            className="w-full min-h-[400px] rounded-lg overflow-hidden border"
            dangerouslySetInnerHTML={{ __html: sanitizeEmbed(data?.embed_code || "") }}
          />
        );

      case "file":
        return (
          <div className="p-8 rounded-lg border bg-muted/30 flex flex-col items-center justify-center">
            <Download className="w-16 h-16 text-primary mb-4" />
            <p className="text-lg font-semibold mb-2">{selectedItem.title}</p>
            {data?.file_size && (
              <p className="text-sm text-muted-foreground mb-4">
                Size: {formatFileSize(data.file_size)}
              </p>
            )}
            {data?.url && (
              <a href={data.url} download target="_blank" rel="noopener noreferrer">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </a>
            )}
          </div>
        );

      case "link":
        return (
          <div className="p-8 rounded-lg border bg-muted/30 flex flex-col items-center justify-center">
            <LinkIcon className="w-16 h-16 text-primary mb-4" />
            <p className="text-lg font-semibold mb-4">{selectedItem.title}</p>
            {data?.url && (
              <a href={data.url} target="_blank" rel="noopener noreferrer">
                <Button>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Open Link
                </Button>
              </a>
            )}
          </div>
        );

      case "text":
      default:
        return (
          <div className="prose prose-sm max-w-none p-6 rounded-lg border bg-card">
            <div dangerouslySetInnerHTML={{ __html: sanitizeText(data?.text_content || selectedItem.description || "") }} />
          </div>
        );
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match?.[1] || "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hasAccess || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Access Denied" noindex />
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <Lock className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-muted-foreground mb-6 text-center">
            You need to purchase this product to access its content.
          </p>
          <Link to={`/marketplace/${productId}`}>
            <Button>View Product</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalItems = standaloneItems.length + modules.reduce((sum, m) => sum + m.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${product.title} - Member Portal`}
        noindex
      />
      <Navbar />
      
      <main className="pt-20">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full lg:w-80 xl:w-96 border-r bg-card/50 flex-shrink-0 overflow-y-auto"
          >
            {/* Product Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-orange-500/10">
              <Link 
                to={`/marketplace/${product.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to product
              </Link>
              <div className="flex items-center gap-3">
                {product.thumbnail_url ? (
                  <img 
                    src={product.thumbnail_url} 
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold truncate">{product.title}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                </div>
              </div>
              {seller && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={seller.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {seller.display_name?.[0] || seller.username?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    by {seller.display_name || seller.username}
                  </span>
                </div>
              )}
            </div>

            {/* Content Navigation */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{totalItems} items</span>
              </div>

              {/* Standalone Items */}
              {standaloneItems.length > 0 && (
                <div className="space-y-1 mb-4">
                  {standaloneItems.map(item => {
                    const Icon = getContentIcon(item.content_type);
                    const isSelected = selectedItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectItem(item)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate text-sm">{item.title}</span>
                        {item.is_free_preview && (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Modules with Items */}
              {modules.length > 0 && (
                <Accordion type="multiple" className="space-y-2">
                  {modules.map(module => (
                    <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-1">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-primary" />
                          <span className="truncate">{module.title}</span>
                          <Badge variant="outline" className="text-xs ml-auto mr-2">
                            {module.items.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0 pb-2">
                        <div className="space-y-1">
                          {module.items.map(item => {
                            const Icon = getContentIcon(item.content_type);
                            const isSelected = selectedItem?.id === item.id;
                            
                            return (
                              <button
                                key={item.id}
                                onClick={() => selectItem(item)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-muted"
                                }`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 truncate text-sm">{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {totalItems === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No content available yet</p>
                  <p className="text-xs mt-1">Check back soon!</p>
                </div>
              )}
            </div>
          </motion.aside>

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div
                  key={selectedItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-4xl mx-auto"
                >
                  {/* Content Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      {(() => {
                        const Icon = getContentIcon(selectedItem.content_type);
                        return <Icon className="w-4 h-4" />;
                      })()}
                      <span className="text-sm">{CONTENT_TYPE_LABELS[selectedItem.content_type] || "Content"}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold">{selectedItem.title}</h1>
                    {selectedItem.description && (
                      <p className="text-muted-foreground mt-2">{selectedItem.description}</p>
                    )}
                  </div>

                  {/* Content */}
                  {renderContent()}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Select content to view</h2>
                  <p className="text-muted-foreground">Choose an item from the sidebar</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </main>
    </div>
  );
};

export default MemberPortal;
