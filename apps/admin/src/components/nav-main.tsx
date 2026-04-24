import { type LucideIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const { setOpenMobile, isMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-2">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton tooltip={item.title} asChild size="lg">
              <Link
                to={item.url}
                activeOptions={{ exact: item.url === "/" }}
                className="group"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false)
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {item.icon && (
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                    )}
                    <span className={cn(
                      "font-medium transition-colors",
                      isActive ? "text-primary" : "text-zinc-600"
                    )}>
                      {item.title}
                    </span>
                  </>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
