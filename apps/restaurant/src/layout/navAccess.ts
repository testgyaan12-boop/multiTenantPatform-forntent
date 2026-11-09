export interface RouteAccess {
  read: string;
  write?: string;
}

export const routeAccess: Record<string, RouteAccess> = {
  '/': { read: 'dashboard.read' },
  '/orders': { read: 'order.read', write: 'order.manage' },
  '/menu': { read: 'menu.read', write: 'menu.manage' },
  '/inquiries': { read: 'inquiry.read', write: 'inquiry.manage' },
  '/tables': { read: 'table.read', write: 'table.manage' },
  '/employees': { read: 'employee.read', write: 'employee.manage' },
  '/reports': { read: 'report.read' },
  '/branches': { read: 'branch.read', write: 'branch.manage' },
};

export function accessFor(route: string): RouteAccess | undefined {
  return routeAccess[route];
}
export function accessibleRoutes(can: (code: string) => boolean): string[] {
  return Object.keys(routeAccess).filter((route) => {
    const access = routeAccess[route];
    return access ? can(access.read) : false;
  });
}
