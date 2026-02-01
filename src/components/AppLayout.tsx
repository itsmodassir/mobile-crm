import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Settings } from 'lucide-react';
import { cn } from '../lib/cn';

export function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: PlusCircle, label: 'Add Lead', path: '/add' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-lg pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full transition-colors active:scale-95",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
