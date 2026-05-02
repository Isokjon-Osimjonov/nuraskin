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
    title: "Boshqaruv paneli",
    url: "/",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Kategoriyalar",
    url: "/categories",
    icon: TagsIcon,
  },
  {
    title: "Mahsulotlar",
    url: "/products",
    icon: PackageIcon,
  },
  {
    title: "Ombor",
    url: "/inventory",
    icon: PackageIcon, 
  },
  {
    title: "Buyurtmalar",
    url: "/orders/",
    icon: ShoppingCartIcon,
  },
  {
    title: "Mijozlar",
    url: "/customers",
    icon: UsersIcon,
  },
  {
    title: "Jamoa",
    url: "/settings/team",
    icon: ShieldCheckIcon,
  },
  {
    title: "Telegram",
    url: "/telegram",
    icon: SendIcon,
    items: [
      {
        title: "Statistika",
        url: "/telegram",
        icon: BarChartIcon,
      },
      {
        title: "Kanallar",
        url: "/telegram/channels",
        icon: RadioIcon,
      },
      {
        title: "Yangi post",
        url: "/telegram/posts/new",
        icon: MailIcon,
      },
    ],
  },
  {
    title: "Kuponlar",
    url: "/coupons",
    icon: TicketIcon,
  },
  {
    title: "Sotuvlar",
    url: "/sales",
    icon: TrendingUpIcon,
  },
  {
    title: "Buxgalteriya",
    url: "/accounting",
    icon: WalletIcon,
  },
  {
    title: "Sozlamalar",
    url: "/settings/",
    icon: SettingsIcon,
  },
  {
    title: "Valyuta kurslari",
    url: "/settings/rates",
    icon: TrendingUpIcon,
  },
  {
    title: "Yetkazib berish",
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
