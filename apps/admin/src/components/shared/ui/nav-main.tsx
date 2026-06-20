import { type LucideIcon } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavMain({
  label,
  items,
}: {
  label: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map(item => {
          const isActive =
            item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild className="p-0">
                <Link
                  to={item.url}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors w-full h-full',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                  )}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                  )}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
