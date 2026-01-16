import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Sparkles, DollarSign, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AffiliateBanner = () => {
  return (
    <section className="relative py-4 md:py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Mobile-optimized banner */}
          <Link to="/affiliate" className="block">
            <div className="relative rounded-2xl overflow-hidden gradient-bg p-[2px]">
              <div className="bg-background rounded-2xl p-4 md:p-6 relative overflow-hidden">
                {/* Animated background sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ 
                      x: [0, 100, 0],
                      y: [0, -50, 0],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute top-2 right-8 w-16 h-16 bg-primary/20 rounded-full blur-xl"
                  />
                  <motion.div
                    animate={{ 
                      x: [0, -80, 0],
                      y: [0, 30, 0],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute bottom-2 left-12 w-12 h-12 bg-secondary/20 rounded-full blur-xl"
                  />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
                  {/* Left - Icon and Main Text */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0"
                    >
                      <Gift className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AFFILIATE PROGRAM
                        </span>
                      </div>
                      <h3 className="font-display text-lg md:text-xl font-bold">
                        Refer Friends & Earn <span className="gradient-text">$5/Signup!</span>
                      </h3>
                    </div>
                  </div>

                  {/* Center - Stats (visible on larger screens) */}
                  <div className="hidden md:flex items-center gap-6 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="font-bold">$5</p>
                        <p className="text-xs text-muted-foreground">Per Signup</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">5%</p>
                        <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-bold">Instant</p>
                        <p className="text-xs text-muted-foreground">Payout</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats Row */}
                  <div className="flex md:hidden items-center gap-4 w-full justify-center">
                    <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-full">
                      <DollarSign className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-bold text-success">$5/signup</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-primary">5% lifetime</span>
                    </div>
                  </div>

                  {/* Right - CTA Button */}
                  <Button variant="hero" size="sm" className="shrink-0 group">
                    Start Earning
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
