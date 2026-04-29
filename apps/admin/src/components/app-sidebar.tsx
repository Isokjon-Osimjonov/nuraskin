import * as React from "react"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingCartIcon,
  TagsIcon,
  TrendingUpIcon,
  SettingsIcon,
  WalletIcon,
  SendIcon,
  TicketIcon,
  UsersIcon,
  ShieldCheckIcon,
  BarChartIcon,
  RadioIcon,
  MailIcon,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth.store"
import { useShallow } from "zustand/shallow"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: TagsIcon,
  },
  {
    title: "Products",
    url: "/products",
    icon: PackageIcon,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: PackageIcon, 
  },
  {
    title: "Orders",
    url: "/orders/",
    icon: ShoppingCartIcon,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: UsersIcon,
  },
  {
    title: "Team",
    url: "/settings/team",
    icon: ShieldCheckIcon,
  },
  {
    title: "Telegram",
    url: "/telegram",
    icon: SendIcon,
    items: [
      {
        title: "Dashboard",
        url: "/telegram",
        icon: BarChartIcon,
      },
      {
        title: "Channels",
        url: "/telegram/channels",
        icon: RadioIcon,
      },
      {
        title: "New Post",
        url: "/telegram/posts/new",
        icon: MailIcon,
      },
    ],
  },
  {
    title: "Coupons",
    url: "/coupons",
    icon: TicketIcon,
  },
  {
    title: "Sales",
    url: "/sales",
    icon: TrendingUpIcon,
  },
  {
    title: "Accounting",
    url: "/accounting",
    icon: WalletIcon,
  },
  {
    title: "Settings",
    url: "/settings/",
    icon: SettingsIcon,
  },
  {
    title: "Exchange Rates",
    url: "/settings/rates",
    icon: TrendingUpIcon,
  },
  {
    title: "Shipping Tiers",
    url: "/settings/shipping-tiers",
    icon: ShoppingCartIcon,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore(useShallow((s) => ({
    name: (s.user as any)?.fullName || "Admin",
    email: s.user?.email || "admin@nuraskin.uz",
    avatar: "",
  })))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-medium">N</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-lg">NuraSkin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
