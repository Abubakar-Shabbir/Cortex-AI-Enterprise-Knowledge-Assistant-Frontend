import {
  WarningIcon as AlertTriangle, CertificateIcon as BadgeCheck, BellIcon as Bell, CheckCircleIcon as CheckCircle,
  FileArrowUpIcon as FileUp, KeyIcon as KeyRound, MegaphoneIcon as Megaphone, ShareNetworkIcon as Share2,
  ShieldIcon as Shield, ShieldWarningIcon as ShieldAlert, ShieldSlashIcon as ShieldOff, SparkleIcon as Sparkles,
  UserCheckIcon as UserCheck, UserMinusIcon as UserX, XCircleIcon as XCircle,
} from '@phosphor-icons/react';

// Maps the kebab-case Phosphor icon names RAG.notification_views._NOTIFICATION_ICONS
// sends (e.g. "share-network") to the matching Phosphor icon component.
export const NOTIFICATION_ICONS = {
  'share-network': Share2,
  'shield-slash': ShieldOff,
  'file-arrow-up': FileUp,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  sparkle: Sparkles,
  warning: AlertTriangle,
  certificate: BadgeCheck,
  key: KeyRound,
  shield: Shield,
  'shield-warning': ShieldAlert,
  'user-minus': UserX,
  'user-check': UserCheck,
  megaphone: Megaphone,
  bell: Bell,
};

export function notificationIcon(name) {
  return NOTIFICATION_ICONS[name] || Bell;
}
