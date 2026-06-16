import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  BarChart2,
  ShoppingBag,
  Users,
  Package,
  Layers,
  Boxes,
  Receipt,
  TrendingUp,
  Send,
  Settings2,
  Tag,
  Truck,
} from 'lucide-react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthStore } from '../../../stores/auth.store';

const navMain = [
  {
    title: 'Umumiy',
    items: [{ title: 'Dashboard', url: '/', icon: BarChart2 }],
  },
  {
    title: 'Savdo',
    items: [
      { title: 'Buyurtmalar', url: '/orders', icon: ShoppingBag },
      { title: 'Mijozlar', url: '/customers', icon: Users },
      { title: 'Kuponlar', url: '/coupons', icon: Tag },
    ],
  },
  {
    title: 'Mahsulotlar',
    items: [
      { title: 'Mahsulotlar', url: '/products', icon: Package },
      { title: 'Kategoriyalar', url: '/categories', icon: Layers },
      { title: 'Inventar', url: '/inventory', icon: Boxes },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { title: 'Sotuvlar', url: '/sales', icon: TrendingUp },
      { title: 'Buxgalteriya', url: '/accounting', icon: Receipt },
    ],
  },
  {
    title: 'Marketing',
    items: [{ title: 'Telegram', url: '/telegram', icon: Send }],
  },
  {
    title: 'Tizim',
    items: [
      { title: 'Sozlamalar', url: '/settings', icon: Settings2 },
      { title: 'Valyuta kurslari', url: '/settings/rates', icon: TrendingUp },
      { title: 'Yetkazib berish', url: '/settings/shipping-tiers', icon: Truck },
      { title: 'Jamoa', url: '/settings/team', icon: Users },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore(s => s.user);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShoppingBag className="size-4" strokeWidth={2.5} />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold">NuraSkin Admin</span>
                  <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider">
                    Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navMain.map(group => (
          <NavMain key={group.title} label={group.title} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.fullName || 'Admin',
              email: user.email,
              role: (user as any).isSuperAdmin
                ? 'Super Admin'
                : (user as any).role?.name || 'Admin',
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
