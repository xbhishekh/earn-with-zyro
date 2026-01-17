import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥"],
  "Gestures": ["👍", "👎", "👏", "🙌", "🤝", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "👈", "👉", "👆", "👇", "☝️", "🙏", "💪", "🦾"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  "Reactions": ["🔥", "💯", "✨", "⭐", "🌟", "💥", "💫", "🎉", "🎊", "🥳", "🙈", "🙉", "🙊", "💀", "👀", "👁️", "🗣️", "💬", "💭", "🗯️"],
  "Objects": ["💎", "💰", "💵", "💸", "🎯", "🏆", "🥇", "🎖️", "📈", "📊", "💼", "📱", "💻", "⌨️", "🖥️", "🎮", "🎬", "📷", "🔔", "📌"],
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  showQuickReactions?: boolean;
  onQuickReaction?: (emoji: string) => void;
}

export function EmojiPicker({
  onSelect,
  trigger,
  side = "top",
  align = "center",
  className,
  showQuickReactions = false,
  onQuickReaction,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Smileys");

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", className)}>
            <Smile className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        side={side} 
        align={align}
        className="w-80 p-0 shadow-xl"
        sideOffset={8}
      >
        {/* Quick reactions */}
        {showQuickReactions && onQuickReaction && (
          <div className="flex items-center justify-around p-2 border-b border-border bg-muted/30">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onQuickReaction(emoji);
                  setOpen(false);
                }}
                className="text-xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-1 p-2 border-b border-border overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-2 h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="text-xl hover:bg-muted rounded p-1 transition-colors hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Quick reaction bar that shows on message hover
interface QuickReactionsBarProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export function QuickReactionsBar({ onReact, className }: QuickReactionsBarProps) {
  return (
    <div className={cn(
      "flex items-center gap-0.5 p-1 rounded-full bg-background shadow-lg border border-border",
      className
    )}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="text-sm hover:scale-125 transition-transform p-1 hover:bg-muted rounded-full"
        >
          {emoji}
        </button>
      ))}
      <EmojiPicker
        onSelect={onReact}
        trigger={
          <button className="p-1 hover:bg-muted rounded-full">
            <Smile className="w-4 h-4 text-muted-foreground" />
          </button>
        }
        side="top"
      />
    </div>
  );
}
