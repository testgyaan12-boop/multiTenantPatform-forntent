import { Box, Card, Stack, Typography } from '@mui/material';
import { BookOpen, LifeBuoy, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@resto/ui';

const sections = [
  {
    icon: <BookOpen size={18} />,
    title: 'Runbooks',
    items: [
      'Onboarding a restaurant: Restaurants → Add restaurant → share the invite token from Users.',
      'Verification: Onboarding Requests shows PENDING_VERIFICATION tenants; Verify activates the owner.',
      'Billing: Subscriptions → Assign plan creates an OPEN invoice; mark it paid under Invoices.',
    ],
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Access model',
    items: [
      'Every screen on this app calls /api/v1/superadmin/** which requires the SUPER_ADMIN role.',
      'Role permissions for tenant staff are managed under Roles & Permissions.',
      'System roles are seeded in code (V2/V4) and cannot be edited.',
    ],
  },
  {
    icon: <LifeBuoy size={18} />,
    title: 'Support contacts',
    items: [
      'Platform operator: support@resto-saas.local (configure under System Settings).',
      'Escalation for billing issues: attach the invoice number from Invoices & Payments.',
    ],
  },
];

export function HelpPage() {
  return (
    <>
      <PageHeader title="Help & Support" subtitle="Internal runbooks for operating the platform." />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {sections.map((section) => (
          <Card key={section.title} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              {section.icon}
              <Typography variant="h4">{section.title}</Typography>
            </Stack>
            <Stack spacing={1}>
              {section.items.map((item) => (
                <Typography key={item} variant="body2" color="text.secondary">
                  • {item}
                </Typography>
              ))}
            </Stack>
          </Card>
        ))}
      </Box>
    </>
  );
}
