import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";

/**
 * Responsive select: uses a bottom-sheet Drawer on mobile, standard Select on desktop.
 * @param {Array<{value: string, label: string}>} options
 */
export default function MobileSelect({ value, onValueChange, options, placeholder, className, triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : (placeholder || "");

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ${className || ""} ${triggerClassName || ""}`}
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>{displayLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">{placeholder || ""}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onValueChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                opt.value === value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}