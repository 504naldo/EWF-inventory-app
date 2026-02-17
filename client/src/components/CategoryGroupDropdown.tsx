import { useState, useRef, useEffect } from "react";
import { CategoryGroup } from "../../../shared/category-groups";
import { Category } from "../../../shared/categories";
import { cn } from "../lib/utils";

interface CategoryGroupDropdownProps {
  group: CategoryGroup;
  selectedCategory: Category | "All";
  onSelectCategory: (category: Category) => void;
  isActive: boolean;
}

export function CategoryGroupDropdown({
  group,
  selectedCategory,
  onSelectCategory,
  isActive,
}: CategoryGroupDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const hasSelectedCategory = group.categories.some(cat => cat === selectedCategory);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm flex items-center gap-2",
          "hover:shadow-md",
          hasSelectedCategory || isActive
            ? "border-[#6B7F39] bg-[#6B7F39] text-white"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        )}
      >
        <span className="text-base">{group.icon}</span>
        <span>{group.name}</span>
        <svg
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[280px]">
          {group.categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                onSelectCategory(category);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors",
                selectedCategory === category
                  ? "bg-[#6B7F39] text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
