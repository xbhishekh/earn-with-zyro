import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const Toaster = () => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <div>
        {toasts.map(function ({ id, title, description, action, ...toastProps }) {
          return (
            <Toast key={id} {...toastProps}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
      </div>
      <ToastViewport />
    </ToastProvider>
  );
};

export { Toaster };
