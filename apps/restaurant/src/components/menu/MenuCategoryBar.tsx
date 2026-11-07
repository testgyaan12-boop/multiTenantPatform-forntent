import { Box, Button, Chip, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import type { MenuCategory } from '@resto/types';

interface MenuCategoryBarProps {
  categories: MenuCategory[];
  counts: Map<number, number>;
  totalItems: number;
  selected: number | 'ALL';
  onSelect: (value: number | 'ALL') => void;
  onAddCategory: () => void;
  canManage: boolean;
}

export function MenuCategoryBar({
  categories,
  counts,
  totalItems,
  selected,
  onSelect,
  onAddCategory,
  canManage,
}: MenuCategoryBarProps) {
  const chips: { key: string; label: string; count: number; value: number | 'ALL' }[] = [
    { key: 'all', label: 'All Items', count: totalItems, value: 'ALL' },
    ...categories.map((category) => ({
      key: `cat-${category.id}`,
      label: category.name,
      count: counts.get(category.id) ?? 0,
      value: category.id as number | 'ALL',
    })),
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#D0D5DD', borderRadius: 3 },
      }}
    >
      {chips.map((chip) => {
        const active = selected === chip.value;
        return (
          <Chip
            key={chip.key}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {chip.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: active ? '#ffffff' : '#718096',
                    bgcolor: active ? 'rgba(255,255,255,0.24)' : 'rgba(23,32,51,0.06)',
                    borderRadius: '6px',
                    px: 0.6,
                    py: '1px',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {chip.count}
                </Typography>
              </Box>
            }
            onClick={() => onSelect(chip.value)}
            aria-pressed={active}
            sx={{
              height: 36,
              px: 0.5,
              flexShrink: 0,
              borderRadius: '10px',
              bgcolor: active ? '#F4511E' : '#F1F3F7',
              color: active ? '#ffffff' : '#475467',
              '&:hover': { bgcolor: active ? '#F4511E' : '#E6E9EF' },
            }}
          />
        );
      })}

      {canManage ? (
        <Button
          size="small"
          startIcon={<Plus size={15} />}
          onClick={onAddCategory}
          sx={{
            flexShrink: 0,
            height: 36,
            px: 1.25,
            borderRadius: '10px',
            border: '1px dashed',
            borderColor: '#F4511E',
            color: '#F4511E',
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: 'nowrap',
            '&:hover': { borderStyle: 'solid', bgcolor: 'rgba(244,81,30,0.06)' },
          }}
        >
          Add Category
        </Button>
      ) : null}
    </Box>
  );
}
