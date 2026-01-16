import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Clock, 
  Zap, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Server,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getPerformanceSummary, getPerformanceLog, clearPerformanceLog } from "@/hooks/usePerformanceMonitor";

const AdminPerformance = () => {
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [logs, setLogs] = useState(getPerformanceLog());

  const refreshData = () => {
    setSummary(getPerformanceSummary());
    setLogs(getPerformanceLog());
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    clearPerformanceLog();
    refreshData();
  };

  const getStatusColor = (time: number, threshold: number) => {
    if (time < threshold * 0.5) return "text-success";
    if (time < threshold) return "text-warning";
    return "text-destructive";
  };

  const getStatusBadge = (time: number, threshold: number) => {
    if (time < threshold * 0.5) return "success";
    if (time < threshold) return "warning";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time performance metrics and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearLogs}>
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Page Load</p>
                  <p className={`text-2xl font-bold ${getStatusColor(summary.avgPageLoad, 2000)}`}>
                    {summary.avgPageLoad}ms
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
              </div>
              <Progress 
                value={Math.min(100, (summary.avgPageLoad / 3000) * 100)} 
                className="mt-3 h-1.5" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg API Response</p>
                  <p className={`text-2xl font-bold ${getStatusColor(summary.avgApiResponse, 500)}`}>
                    {summary.avgApiResponse}ms
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Server className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <Progress 
                value={Math.min(100, (summary.avgApiResponse / 1000) * 100)} 
                className="mt-3 h-1.5" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Slow Pages</p>
                  <p className={`text-2xl font-bold ${summary.slowPages.length > 0 ? 'text-warning' : 'text-success'}`}>
                    {summary.slowPages.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{summary.totalRequests}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Slow Pages Alert */}
      {summary.slowPages.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Slow Pages Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.slowPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-background rounded-lg">
                  <code className="text-sm">{page.route}</code>
                  <Badge variant="outline" className="text-warning border-warning">
                    {page.time?.toFixed(0)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow APIs Alert */}
      {summary.slowApis.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Slow API Calls Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.slowApis.map((api, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-background rounded-lg">
                  <code className="text-sm">{api.route}</code>
                  <Badge variant="destructive">
                    {api.time?.toFixed(0)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Performance Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No performance data yet. Navigate around to collect metrics.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {logs.slice(0, 20).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.type === 'api' ? 'secondary' : 'outline'}>
                      {log.type}
                    </Badge>
                    <code className="text-sm">{log.route}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.metrics.pageLoadTime && (
                      <Badge 
                        variant={getStatusBadge(log.metrics.pageLoadTime, log.type === 'api' ? 500 : 2000) as "default"}
                      >
                        {log.metrics.pageLoadTime.toFixed(0)}ms
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPerformance;
