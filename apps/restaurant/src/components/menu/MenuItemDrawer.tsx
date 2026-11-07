import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Image as ImageIcon, Trash2, X } from 'lucide-react';
import { menuItemSchema } from '@resto/validation';
import type {
  MenuCategory,
  MenuItem as MenuItemModel,
  MenuItemAttribute,
  MenuItemRequest,
} from '@resto/types';

interface MenuItemDrawerProps {
  open: boolean;
  editing: MenuItemModel | null;
  categories: MenuCategory[];
  currency: string;
  onClose: () => void;
  onSubmit: (payload: MenuItemRequest) => Promise<void>;
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  categoryId: number;
  price: number | '';
  cost: number | '';
  prepTimeMinutes: number | '';
  calories: number | '';
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  stockQty: number | '';
  attributes: MenuItemAttribute[];
}

function initialForm(editing: MenuItemModel | null, categories: MenuCategory[]): FormState {
  if (editing) {
    return {
      name: editing.name,
      sku: editing.sku,
      description: editing.description ?? '',
      categoryId: editing.categoryId,
      price: editing.price,
      cost: editing.cost ?? '',
      prepTimeMinutes: editing.prepTimeMinutes ?? '',
      calories: editing.calories ?? '',
      imageUrl: editing.imageUrl ?? '',
      isAvailable: editing.isAvailable,
      isFeatured: editing.isFeatured,
      stockQty: editing.stockQty ?? '',
      attributes: (editing.attributes ?? []).map((attribute) => ({ ...attribute })),
    };
  }
  return {
    name: '',
    sku: '',
    description: '',
    categoryId: categories[0]?.id ?? 0,
    price: '',
    cost: '',
    prepTimeMinutes: '',
    calories: '',
    imageUrl: '',
    isAvailable: true,
    isFeatured: false,
    stockQty: '',
    attributes: [],
  };
}

export function MenuItemDrawer({
  open,
  editing,
  categories,
  onClose,
  onSubmit,
}: MenuItemDrawerProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(editing, categories));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(editing, categories));
      setFieldErrors({});
      setApiError(null);
      setSaving(false);
      setImageFailed(false);
    }
  }, [open, editing, categories]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const addAttribute = () => {
    setForm((previous) =>
      previous.attributes.length >= 30
        ? previous
        : { ...previous, attributes: [...previous.attributes, { key: '', value: '' }] },
    );
  };

  const removeAttribute = (index: number) => {
    setForm((previous) => ({
      ...previous,
      attributes: previous.attributes.filter((_, position) => position !== index),
    }));
  };

  const setAttribute = (index: number, field: 'key' | 'value', value: string) => {
    setForm((previous) => ({
      ...previous,
      attributes: previous.attributes.map((attribute, position) =>
        position === index ? { ...attribute, [field]: value } : attribute,
      ),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setApiError(null);

    const parsed = menuItemSchema.safeParse({
      name: form.name,
      description: form.description,
      sku: form.sku,
      price: form.price === '' ? Number.NaN : form.price,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl.trim(),
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    const payload: MenuItemRequest = {
      categoryId: Number(parsed.data.categoryId),
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description || '',
      price: Number(parsed.data.price),
      cost: form.cost === '' ? undefined : Number(form.cost),
      imageUrl: parsed.data.imageUrl || undefined,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      prepTimeMinutes: form.prepTimeMinutes === '' ? undefined : Number(form.prepTimeMinutes),
      calories: form.calories === '' ? undefined : Number(form.calories),
      stockQty: form.stockQty === '' ? undefined : Number(form.stockQty),
      attributes: form.attributes
        .filter((attribute) => attribute.key.trim() && attribute.value.trim())
        .map((attribute) => ({ key: attribute.key.trim(), value: attribute.value.trim() })),
    };

    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Failed to save the item.';
      setApiError(message);
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 540 },
            borderLeft: { sm: '1px solid' },
            borderLeftColor: { sm: 'divider' },
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {editing ? 'Edit menu item' : 'Add menu item'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {editing ? `Updating “${editing.name}”` : 'Add a new dish to your restaurant menu.'}
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close form" onClick={onClose} disabled={saving}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2.5 }}>
          {apiError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
              {apiError}
            </Alert>
          ) : null}

          <Section title="Basic information">
            <Box sx={{ display: 'grid', gap: 1.75 }}>
              <TextField
                label="Item name"
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                required
                fullWidth
                inputProps={{ maxLength: 120 }}
              />
              {categories.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 13 }}>
                  Create a category first — items must belong to a category.
                </Alert>
              ) : (
                <TextField
                  select
                  label="Category"
                  value={form.categoryId || ''}
                  onChange={(event) => set('categoryId', Number(event.target.value))}
                  error={Boolean(fieldErrors.categoryId)}
                  helperText={fieldErrors.categoryId}
                  required
                  fullWidth
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                label="SKU / item code"
                value={form.sku}
                onChange={(event) => set('sku', event.target.value)}
                error={Boolean(fieldErrors.sku)}
                helperText={fieldErrors.sku ?? 'Must be unique across your menu'}
                required
                fullWidth
                inputProps={{ maxLength: 60 }}
              />
              <TextField
                label="Description"
                multiline
                minRows={3}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
                error={Boolean(fieldErrors.description)}
                helperText={fieldErrors.description}
                fullWidth
                inputProps={{ maxLength: 1000 }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Featured item</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    Highlight this dish on the guest menu
                  </Typography>
                </Box>
                <Switch
                  checked={form.isFeatured}
                  onChange={(event) => set('isFeatured', event.target.checked)}
                  inputProps={{ 'aria-label': 'Featured item' }}
                  color="primary"
                />
              </Box>
            </Box>
          </Section>

          <Divider />

          <Section title="Pricing">
            <Box sx={{ display: 'grid', gap: 1.75 }}>
              <TextField
                label="Selling price (INR)"
                type="number"
                value={form.price}
                onChange={(event) =>
                  set('price', event.target.value === '' ? '' : Number(event.target.value))
                }
                error={Boolean(fieldErrors.price)}
                helperText={fieldErrors.price}
                required
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
                <TextField
                  label="Cost price"
                  type="number"
                  value={form.cost}
                  onChange={(event) =>
                    set('cost', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  fullWidth
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Internal use only"
                />
                <TextField
                  label="Prep time (min)"
                  type="number"
                  value={form.prepTimeMinutes}
                  onChange={(event) =>
                    set('prepTimeMinutes', event.target.value === '' ? '' : Number(event.target.value))
                  }
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Box>
              <TextField
                label="Calories (kcal)"
                type="number"
                value={form.calories}
                onChange={(event) =>
                  set('calories', event.target.value === '' ? '' : Number(event.target.value))
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Box>
          </Section>

          <Divider />

          <Section title="Stock & specifications">
            <Box sx={{ display: 'grid', gap: 1.75 }}>
              <TextField
                label="Stock quantity"
                type="number"
                value={form.stockQty}
                onChange={(event) =>
                  set('stockQty', event.target.value === '' ? '' : Number(event.target.value))
                }
                fullWidth
                inputProps={{ min: 0 }}
                helperText="Leave blank if stock is not tracked (e.g. services)."
              />
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, mb: 1 }}>
                  Attributes
                  <Typography component="span" sx={{ ml: 1, fontSize: 11.5, color: 'text.secondary' }}>
                    Shown to customers as specifications ({form.attributes.length}/30)
                  </Typography>
                </Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {form.attributes.map((attribute, index) => (
                    <Box
                      key={index}
                      sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 1, alignItems: 'center' }}
                    >
                      <TextField
                        size="small"
                        label="Name"
                        value={attribute.key}
                        onChange={(event) => setAttribute(index, 'key', event.target.value)}
                        inputProps={{ maxLength: 60 }}
                      />
                      <TextField
                        size="small"
                        label="Value"
                        value={attribute.value}
                        onChange={(event) => setAttribute(index, 'value', event.target.value)}
                        inputProps={{ maxLength: 255 }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Remove attribute"
                        onClick={() => removeAttribute(index)}
                        color="inherit"
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Box>
                  ))}
                  {form.attributes.length === 0 ? (
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      No attributes yet — e.g. Warranty, Colour, Kilometres.
                    </Typography>
                  ) : null}
                </Box>
                <Button
                  size="small"
                  onClick={addAttribute}
                  disabled={form.attributes.length >= 30}
                  sx={{ mt: 1.25, fontSize: 13, textTransform: 'none' }}
                >
                  + Add attribute
                </Button>
              </Box>
            </Box>
          </Section>

          <Divider />

          <Section title="Food image">
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  bgcolor: '#EEF1F5',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#98A2B3',
                }}
              >
                <Box sx={{ textAlign: 'center', display: 'grid', gap: 0.5, justifyItems: 'center' }}>
                  <ImageIcon size={26} strokeWidth={1.5} />
                  <Typography sx={{ fontSize: 12 }}>
                    {form.imageUrl && !imageFailed ? 'Image preview' : 'No image yet'}
                  </Typography>
                </Box>
                {form.imageUrl && !imageFailed ? (
                  <Box
                    component="img"
                    src={form.imageUrl}
                    alt="Menu item preview"
                    onError={() => setImageFailed(true)}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : null}
              </Box>
              <TextField
                label="Image URL"
                value={form.imageUrl}
                onChange={(event) => {
                  set('imageUrl', event.target.value);
                  setImageFailed(false);
                }}
                error={Boolean(fieldErrors.imageUrl)}
                helperText={
                  fieldErrors.imageUrl ??
                  'Paste a direct link to the dish photo (http:// or https://)'
                }
                fullWidth
                inputProps={{ maxLength: 500 }}
              />
              {form.imageUrl ? (
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<Trash2 size={14} />}
                  onClick={() => {
                    set('imageUrl', '');
                    setImageFailed(false);
                  }}
                  sx={{ justifySelf: 'start', color: 'text.secondary', fontSize: 13 }}
                >
                  Remove image
                </Button>
              ) : null}
            </Box>
          </Section>

          <Divider />

          <Section title="Availability">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                px: 1.5,
                py: 0.75,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                  {form.isAvailable ? 'Available to order' : 'Unavailable'}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  {form.isAvailable
                    ? 'Guests can see and order this item.'
                    : 'Hidden from guest ordering until you make it available again.'}
                </Typography>
              </Box>
              <Switch
                checked={form.isAvailable}
                onChange={(event) => set('isAvailable', event.target.checked)}
                inputProps={{ 'aria-label': 'Item availability' }}
                color="primary"
              />
            </Box>
          </Section>
        </Box>

        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
            bgcolor: '#ffffff',
          }}
        >
          <Button color="inherit" onClick={onClose} disabled={saving} sx={{ px: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || categories.length === 0}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ px: 3, py: 0.9 }}
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Item'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'text.secondary',
          mb: 1.25,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
