import { Search, User, LogOut, Settings } from "lucide-react"
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from "@/stores/auth.store"
import { useShallow } from "zustand/shallow"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function SiteHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore(useShallow((s) => ({
    user: s.user,
    logout: s.logout,
  })))
  
  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const getTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/products')) return 'Products'
    if (path.startsWith('/orders')) return 'Orders'
    if (path.startsWith('/categories')) return 'Categories'
    if (path.startsWith('/coupons')) return 'Coupons'
    if (path.startsWith('/sales')) return 'Sales'
    if (path.startsWith('/accounting')) return 'Accounting'
    if (path.startsWith('/telegram')) return 'Telegram'
    if (path.startsWith('/settings')) return 'Settings'
    return 'NuraSkin Admin'
  }

  const userName = user?.name || "Admin"
  const userEmail = user?.email || "admin@nuraskin.uz"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
        <h1 className="text-sm font-medium">{getTitle()}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <form className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
