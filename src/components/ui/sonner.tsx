import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      gap={10}
      expand={false}
      visibleToasts={4}
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-border/60 !bg-background/95 !backdrop-blur-xl " +
            "!shadow-[0_8px_30px_-6px_hsl(var(--foreground)/0.12),0_2px_8px_-2px_hsl(var(--foreground)/0.08)] " +
            "!px-4 !py-3.5 !pl-3.5 " +
            "!text-foreground group-[.toaster]:font-sans " +
            "data-[type=success]:!border-primary/30 data-[type=success]:!bg-background/95 " +
            "data-[type=error]:!border-destructive/30 " +
            "[&[data-type]]:before:content-[''] [&[data-type]]:before:absolute [&[data-type]]:before:left-0 [&[data-type]]:before:top-3 [&[data-type]]:before:bottom-3 [&[data-type]]:before:w-[3px] [&[data-type]]:before:rounded-full " +
            "data-[type=success]:before:!bg-primary data-[type=error]:before:!bg-destructive data-[type=warning]:before:!bg-yellow-500 data-[type=info]:before:!bg-blue-500",
          title: "!text-[13.5px] !font-semibold !tracking-tight !leading-snug",
          description: "group-[.toast]:!text-muted-foreground !text-[12.5px] !leading-snug !mt-0.5",
          icon: "!mt-0.5",
          success: "[&_[data-icon]]:!text-primary",
          error: "[&_[data-icon]]:!text-destructive",
          warning: "[&_[data-icon]]:!text-yellow-500",
          info: "[&_[data-icon]]:!text-blue-500",
          closeButton:
            "!bg-background !border-border/60 !text-muted-foreground hover:!text-foreground hover:!border-border " +
            "!transition-colors !shadow-sm group-[.toast]:!left-auto group-[.toast]:!right-[-8px] group-[.toast]:!top-[-8px]",
          actionButton:
            "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground !rounded-lg !px-3 !py-1.5 !text-xs !font-semibold",
          cancelButton:
            "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground !rounded-lg !px-3 !py-1.5 !text-xs",
          loader: "[&_[data-icon]]:!text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
