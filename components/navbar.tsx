'use client';

import {
    Navbar as HeroUINavbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
} from "@heroui/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

import { useTheme } from "next-themes";
import { siteConfig } from "@/config/site";
import { SunFilledIcon, MoonFilledIcon } from "./icons";
import { Logo } from "./icons";

export const Navbar = () => {
    const { theme, setTheme } = useTheme();

    const navItems = [
        { label: "Home", href: "/" },
        { label: "Configuration", href: "/config" },
        { label: "Collect Content", href: "/collect" },
    ];

    return (
        <HeroUINavbar maxWidth="xl" position="sticky" className="bg-background/80 backdrop-blur-md shadow-sm">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <Link className="flex justify-start items-center gap-1" href="/">
                        <p className="font-bold text-inherit text-xl">{siteConfig.name}</p>
                    </Link>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent
                className="hidden sm:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem className="flex gap-2 items-center">
                    <Button as={Link} color="primary" href="https://github.com/MuseDeck/website" variant="flat" size="md">
                        GitHub Repo
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="sm:hidden basis-1/5" justify="end">
                <NavbarMenuToggle />
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    {navItems.map((item, index) => (
                        <NavbarMenuItem key={`${item.label}-${index}`}>
                            <Link
                                color={
                                    index === 2
                                        ? "primary"
                                        : index === navItems.length - 1
                                            ? "danger"
                                            : "foreground"
                                }
                                href={item.href}
                                size="lg"
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};