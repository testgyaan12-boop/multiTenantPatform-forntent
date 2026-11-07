import { useState } from 'react';
import {
  Box,
  Card,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { Copy, Eye, EyeOff, Pencil, Star, Trash2, UtensilsCrossed, MoreHorizontal } from 'lucide-react';
import type { MenuCategory, MenuItem as MenuItemModel } from '@resto/types';
import { formatMoney } from '@/format';

interface MenuGridViewProps {
  items: MenuItemModel[];
  categories: MenuCategory[];
  currency: string;
  canManage: boolean;
  onEdit: (item: MenuItemModel) => void;
  onToggleAvailability: (item: MenuItemModel) => void;
  onDuplicate: (item: MenuItemModel) => void;
  onDelete: (item: MenuItemModel) => void;
}

export function MenuGridView({
  items,
  categories,
  currency,
  canManage,
  onEdit,
  onToggleAvailability,
  onDuplicate,
  onDelete,
}: MenuGridViewProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ anchor: HTMLElement; item: MenuItemModel } | null>(null);
  const closeMenu = () => setMenuAnchor(null);
  const categoryName = (id: number) =>
    categories.find((category) => category.id === id)?.name ?? 'Uncategorized';

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {items.map((item) => (
        <Card
          key={item.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '14px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(16,24,40,0.10)',
            },
          }}
        >
          <Box sx={{ position: 'relative', aspectRatio: '4 / 3', bgcolor: '#EEF1F5' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#98A2B3',
              }}
            >
              <UtensilsCrossed size={30} strokeWidth={1.5} />
            </Box>
            {item.imageUrl ? (
              <Box
                component="img"
                src={item.imageUrl}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : null}

            {item.isFeatured ? (
              <Chip
                size="small"
                icon={<Star size={13} style={{ color: '#F59E0B' }} />}
                label="Featured"
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: '#FFF7E6',
                  color: '#B54708',
                  border: 'none',
                }}
              />
            ) : null}

            <Chip
              size="small"
              label={item.isAvailable ? 'Available' : 'Unavailable'}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                height: 24,
                fontSize: 11,
                fontWeight: 700,
                border: 'none',
                bgcolor: item.isAvailable ? '#E7F8F0' : '#FEECEB',
                color: item.isAvailable ? '#16A36A' : '#DC2626',
              }}
            />
          </Box>

          <Box sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {item.name}
              </Typography>
              <Typography noWrap sx={{ fontSize: 16.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
                {formatMoney(item.price, item.currency || currency)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 600, color: '#3B82F6' }}>
                {categoryName(item.categoryId)}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>·</Typography>
              <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                {item.sku}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 12.5,
                color: 'text.secondary',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.9em',
              }}
            >
              {item.description?.trim() || 'No description added yet.'}
            </Typography>

            <Box
              sx={{
                mt: 'auto',
                pt: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              {canManage ? (
                <>
                  <Tooltip title="Edit item">
                    <IconButton
                      size="small"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => onEdit(item)}
                      sx={{ color: '#475467' }}
                    >
                      <Pencil size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                    <IconButton
                      size="small"
                      aria-label={`Toggle availability of ${item.name}`}
                      onClick={() => onToggleAvailability(item)}
                      sx={{ color: item.isAvailable ? '#16A36A' : '#98A2B3' }}
                    >
                      {item.isAvailable ? <Eye size={16} /> : <EyeOff size={16} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Duplicate item">
                    <IconButton
                      size="small"
                      aria-label={`Duplicate ${item.name}`}
                      onClick={() => onDuplicate(item)}
                      sx={{ color: '#475467' }}
                    >
                      <Copy size={16} />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      aria-label={`More actions for ${item.name}`}
                      onClick={(event) => setMenuAnchor({ anchor: event.currentTarget, item })}
                    >
                      <MoreHorizontal size={17} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {item.prepTimeMinutes ? `${item.prepTimeMinutes} min prep` : 'No prep time set'}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {item.calories ? `${item.calories} kcal` : ''}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Card>
      ))}

      <Menu
        anchorEl={menuAnchor?.anchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
              mt: 1,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor) onEdit(menuAnchor.item);
            closeMenu();
          }}
          sx={{ fontSize: 14, gap: 1.5 }}
        >
          <Pencil size={15} /> Edit item
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor) onDelete(menuAnchor.item);
            closeMenu();
          }}
          sx={{ fontSize: 14, gap: 1.5, color: 'error.main' }}
        >
          <Trash2 size={15} /> Delete item
        </MenuItem>
      </Menu>
    </Box>
  );
}
