const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

// Shared byte-count formatter for the billing surfaces (PlanCard,
// PersonalBilling, OrganizationBilling) - previously each file kept
// its own copy of this exact function.
export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${UNITS[i]}`;
}
