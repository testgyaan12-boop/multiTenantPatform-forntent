import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Pencil, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '@resto/ui';
import type { MenuCategory, MenuCategoryRequest } from '@resto/types';

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  counts: Map<number, number>;
  canManage: boolean;
  onCreate: (payload: MenuCategoryRequest) => Promise<void>;
  onUpdate: (id: number, payload: MenuCategoryRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface CategoryForm {
  name: string;
  description: string;
  sortOrder: number | '';
}

const emptyForm: CategoryForm = { name: '', description: '', sortOrder: '' };

export function CategoryDrawer({
  open,
  onClose,
  categories,
  counts,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryDrawerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setForm(emptyForm);
      setNameError(null);
      setApiError(null);
      setDeleteTarget(null);
    }
  }, [open]);

  const startEdit = (category: MenuCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? '',
      sortOrder: category.sortOrder,
    });
    setNameError(null);
    setApiError(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNameError(null);
    setApiError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setApiError(null);

    const name = form.name.trim();
    if (!name) {
      setNameError('Category name is required');
      return;
    }
    if (name.length > 120) {
      setNameError('Name must be at most 120 characters');
      return;
    }
    setNameError(null);

    const payload: MenuCategoryRequest = {
      name,
      description: form.description.trim() || undefined,
      sortOrder: form.sortOrder === '' ? undefined : Number(form.sortOrder),
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      startCreate();
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      if (editingId === deleteTarget.id) startCreate();
      setDeleteTarget(null);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to delete category.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving || deleting ? undefined : onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 460 },
            borderLeft: { sm: '1px solid' },
            borderLeftColor: { sm: 'divider' },
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              Manage categories
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · grouped item counts
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close category manager" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2.5 }}>
          {apiError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
              {apiError}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
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
              {editingId !== null ? 'Edit category' : 'New category'}
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                label="Category name"
                value={form.name}
                onChange={(event) => {
                  setForm((previous) => ({ ...previous, name: event.target.value }));
                  setNameError(null);
                }}
                error={Boolean(nameError)}
                helperText={nameError}
                required
                fullWidth
                autoFocus
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, description: event.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
                inputProps={{ maxLength: 500 }}
              />
              <TextField
                label="Display order"
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    sortOrder: event.target.value === '' ? '' : Number(event.target.value),
                  }))
                }
                fullWidth
                inputProps={{ min: 0 }}
                helperText="Lower numbers appear first on the menu"
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {editingId !== null ? (
                  <Button color="inherit" onClick={startCreate} disabled={saving}>
                    Cancel edit
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !canManage}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{ px: 2.5 }}
                >
                  {saving ? 'Saving…' : editingId !== null ? 'Save changes' : 'Create category'}
                </Button>
              </Box>
            </Box>
          </Box>

          <Divider />

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
              Existing categories
            </Typography>

            {categories.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '10px', fontSize: 13 }}>
                No categories yet — create your first one above.
              </Alert>
            ) : (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {categories.map((category) => {
                  const itemCount = counts.get(category.id) ?? 0;
                  const isEditing = editingId === category.id;
                  return (
                    <Box
                      key={category.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1.1,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isEditing ? '#F4511E' : 'divider',
                        bgcolor: isEditing ? 'rgba(244,81,30,0.04)' : '#ffffff',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700 }}>
                          {category.name}
                        </Typography>
                        {category.description ? (
                          <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                            {category.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Chip
                        size="small"
                        label={`${itemCount} item${itemCount === 1 ? '' : 's'}`}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: '#F1F3F7',
                          color: '#475467',
                          border: 'none',
                        }}
                      />
                      {canManage ? (
                        <>
                          <Tooltip title="Edit category">
                            <IconButton
                              size="small"
                              aria-label={`Edit category ${category.name}`}
                              onClick={() => startEdit(category)}
                              sx={{ color: isEditing ? '#F4511E' : '#475467' }}
                            >
                              <Pencil size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              itemCount > 0
                                ? 'Move or delete its items first'
                                : 'Delete category'
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Delete category ${category.name}`}
                                disabled={itemCount > 0}
                                onClick={() => setDeleteTarget(category)}
                                sx={{ color: '#DC2626' }}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            bgcolor: '#ffffff',
          }}
        >
          <Button color="inherit" onClick={onClose} sx={{ px: 2.5 }}>
            Close
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this category?"
        description={`"${deleteTarget?.name ?? ''}" will be removed from your menu. This cannot be undone.`}
        confirmLabel="Delete category"
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </Drawer>
  );
}
