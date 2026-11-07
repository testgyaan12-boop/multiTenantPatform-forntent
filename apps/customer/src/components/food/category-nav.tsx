import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryGroup } from '@/types';

interface CategoryNavProps {
  categories: CategoryGroup[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
  const clickingRef = useRef(false);

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(`category-${category.id}`))
      .filter((node): node is HTMLElement => Boolean(node));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const id = Number(visible.target.id.replace('category-', ''));
          setActiveId(id);
        }
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  function jumpTo(id: number) {
    clickingRef.current = true;
    setActiveId(id);
    const target = document.getElementById(`category-${id}`);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 116;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    window.setTimeout(() => {
      clickingRef.current = false;
    }, 700);
  }

  if (categories.length === 0) return null;

  return (
    <nav aria-label="Menu categories" className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => jumpTo(category.id)}
            aria-current={activeId === category.id ? 'true' : undefined}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              activeId === category.id
                ? 'bg-primary text-white'
                : 'border border-border bg-card text-muted hover:text-foreground',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
