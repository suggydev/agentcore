// DEPRECATED: SidebarContent is replaced by NewSidebar. This wrapper exists only for backward compatibility.
import NewSidebar from './NewSidebar';

export interface SidebarContentProps {
  isActive: (href: string) => boolean;
  balance: number;
  onOpenCommandPalette: () => void;
}

export default function SidebarContent({ onOpenCommandPalette }: SidebarContentProps) {
  return <NewSidebar onOpenCommandPalette={onOpenCommandPalette} />;
}
