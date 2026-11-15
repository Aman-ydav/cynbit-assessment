import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Brand-styled toaster. (shadcn's default wraps next-themes; this app is light-only.) */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-border !bg-popover !text-popover-foreground !shadow-lift !font-sans",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
