import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/new-session", label: "New Session", icon: Plus },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-md border-b border-border" data-testid="nav-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-4 h-14">
          <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-home">
            <img src="/owl-logo.png" alt="ASOwl" className="h-9 w-9 object-cover rounded-md" style={{ filter: "drop-shadow(0 0 4px rgba(200,50,50,0.4))" }} />
            <span className="font-serif text-lg font-light text-foreground">
              AS<em className="italic text-primary">Owl</em>
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] tracking-[1.5px] uppercase transition-all duration-200 no-underline",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )} data-testid={`link-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full"
                    data-testid="img-user-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden sm:inline text-[9px] tracking-[1px] uppercase text-muted-foreground" data-testid="text-user-name">
                  {user.displayName?.split(" ")[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                  data-testid="button-signout"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
