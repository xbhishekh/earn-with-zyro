import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";

export function NetworkStatusToast() {
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOffline.current) {
        toast.success("Back online", {
          icon: <Wifi className="w-4 h-4" />,
          duration: 3000,
        });
        wasOffline.current = false;
      }
    };

    const handleOffline = () => {
      wasOffline.current = true;
      toast.error("You're offline", {
        icon: <WifiOff className="w-4 h-4" />,
        duration: Infinity,
        id: "offline-toast",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}

export default NetworkStatusToast;
