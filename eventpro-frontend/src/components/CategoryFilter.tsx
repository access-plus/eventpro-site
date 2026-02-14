import { cn } from "@/lib/utils";
import { 
  Music, Trophy, Monitor, Briefcase, Palette, UtensilsCrossed, Heart, 
  GraduationCap, Sparkles, MoreHorizontal, PartyPopper, Flag, Film, 
  Users, Church, Globe, Utensils, type LucideIcon 
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Standard categories
  Music: Music,
  Sports: Trophy,
  Technology: Monitor,
  Business: Briefcase,
  Arts: Palette,
  "Food & Drink": UtensilsCrossed,
  "Health & Wellness": Heart,
  Education: GraduationCap,
  Entertainment: Sparkles,
  // Cultural taxonomy categories
  "Gala & Fundraiser": PartyPopper,
  "National Day Celebration": Flag,
  "Diaspora Film Screening": Film,
  "Community Gathering": Users,
  "Religious & Spiritual": Church,
  "Cultural Festival": Globe,
  "Afrobeat Concert": Music,
  "Caribbean Night": Music,
  "Latin Fiesta": Utensils,
  Other: MoreHorizontal,
};

// Standard event categories
const STANDARD_CATEGORIES = [
  "Music",
  "Sports",
  "Technology",
  "Business",
  "Arts",
  "Food & Drink",
  "Health & Wellness",
  "Education",
  "Entertainment",
];

// Cultural taxonomy categories from the design document
const CULTURAL_CATEGORIES = [
  "Gala & Fundraiser",
  "National Day Celebration",
  "Diaspora Film Screening",
  "Community Gathering",
  "Religious & Spiritual",
  "Cultural Festival",
  "Afrobeat Concert",
  "Caribbean Night",
  "Latin Fiesta",
];

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  className?: string;
  showCultural?: boolean;
}

export const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  className,
  showCultural = true,
}: CategoryFilterProps) => {
  const categories = showCultural 
    ? [...STANDARD_CATEGORIES, ...CULTURAL_CATEGORIES, "Other"]
    : [...STANDARD_CATEGORIES, "Other"];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            selectedCategory === null
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          All Events
        </button>
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category] || MoreHorizontal;
          const isSelected = selectedCategory === category;
          const isCultural = CULTURAL_CATEGORIES.includes(category);
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(isSelected ? null : category)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isCultural
                    ? "bg-accent/30 text-accent-foreground hover:bg-accent/50"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};
