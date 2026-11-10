import { OrdersPage } from './OrdersPage';

export function ProductOrdersPage() {
  return (
    <OrdersPage
      title="Product Orders"
      subtitle="Track product orders across channels - auto-refreshes every 15 seconds."
      managePermission="product_order.manage"
      csvPrefix="product-orders"
      showTablesLink={false}
    />
  );
}
