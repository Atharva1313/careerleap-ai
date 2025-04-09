"use client";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const Header = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
   <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
  <nav className="flex items-center justify-between px-4 h-16 w-full max-w-screen flex-nowrap">
    {/* Logo Section */}
    <div className="flex-shrink-0">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="Sensilogo"
          width={100}
          height={60}
          className="h-12 py-1 w-auto object-contain"
          priority
        />
      </Link>
    </div>

    {/* Navigation Links */}
    <div className="ml-auto flex items-center space-x-4">
      {isClient && (
        <>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button className="flex items-center space-x-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:block">Industry Insight</span>
              </Button>
            </Link>
            <UserButton />
          </SignedIn>

  <DropdownMenu>
  <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
    <DropdownMenuItem>Team</DropdownMenuItem>
    <DropdownMenuItem>Subscription</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

        </>
      )}
    </div>
  </nav>
</header>


  );
};

export default Header;