import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import { Clock, Coins, ExternalLink, Globe, Mail, UserRound, UtensilsCrossed } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import { initialsOf } from './branchUtils';

interface RestaurantProfileCardProps {
  profile: RestaurantProfile | null;
  ownerName: string;
  ownerEmail: string;
  isLoading: boolean;
  onEdit: () => void;
}

export function RestaurantProfileCard({
  profile,
  ownerName,
  ownerEmail,
  isLoading,
  onEdit,
}: RestaurantProfileCardProps) {
  return (
    <Card
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          height: 72,
          bgcolor: 'linear-gradient(120deg, #152033 0%, #1E2F4A 100%)',
          position: 'relative',
        }}
      >
        {profile?.logoUrl ? (
          <Box
            component="img"
            src={profile.logoUrl}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
      </Box>

      <Box sx={{ px: 2.5, pb: 2.5, pt: 0, display: 'grid', gap: 1.25, flex: 1 }}>
        <Avatar
          src={profile?.logoUrl ?? undefined}
          sx={{
            width: 56,
            height: 56,
            mt: -3.5,
            border: '3px solid',
            borderColor: '#ffffff',
            bgcolor: '#F4511E',
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {initialsOf(profile?.name ?? 'R')}
        </Avatar>

        {isLoading ? (
          <>
            <Skeleton variant="text" width="70%" height={26} />
            <Skeleton variant="text" width="45%" />
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography noWrap sx={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {profile?.name ?? 'Restaurant not configured'}
              </Typography>
              <Chip
                size="small"
                label={profile ? 'Active' : 'Incomplete'}
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  bgcolor: profile ? '#E7F8F0' : '#FEECEB',
                  color: profile ? '#16A36A' : '#DC2626',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>
              {profile?.description?.slice(0, 120) || 'Add a description so guests know what you serve.'}
            </Typography>

            <Box sx={{ display: 'grid', gap: 0.75, mt: 0.5 }}>
              <ProfileRow icon={<UserRound size={14} />} label="Owner" value={ownerName} />
              <ProfileRow
                icon={<Mail size={14} />}
                label="Contact"
                value={profile?.contactEmail || ownerEmail}
              />
              <ProfileRow
                icon={<Coins size={14} />}
                label="Currency / TZ"
                value={`${profile?.currency ?? '—'} · ${profile?.timezone ?? '—'}`}
              />
              <ProfileRow
                icon={<Clock size={14} />}
                label="Tax / service"
                value={
                  profile
                    ? `${(Number(profile.taxRate) * 100).toFixed(1)}% / ${(Number(profile.serviceChargeRate) * 100).toFixed(1)}%`
                    : '—'
                }
              />
              {profile?.cuisine ? (
                <ProfileRow icon={<UtensilsCrossed size={14} />} label="Cuisine" value={profile.cuisine} />
              ) : null}
              {profile?.operatingHours ? (
                <ProfileRow icon={<Clock size={14} />} label="Hours" value={profile.operatingHours} />
              ) : null}
              {profile?.publicUrl ? (
                <ProfileRow icon={<Globe size={14} />} label="Public menu" value={profile.publicUrl} />
              ) : null}
            </Box>
          </>
        )}

        <Button
          variant="outlined"
          endIcon={<ExternalLink size={14} />}
          onClick={onEdit}
          disabled={!profile}
          sx={{ mt: 'auto', justifySelf: 'start', px: 2.5, fontSize: 13, fontWeight: 600 }}
        >
          View Profile
        </Button>
      </Box>
    </Card>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box sx={{ color: 'text.secondary', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</Box>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', flexShrink: 0 }}>{label}</Typography>
      <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, textAlign: 'right', flex: 1, minWidth: 0 }}>
        {value}
      </Typography>
    </Box>
  );
}
