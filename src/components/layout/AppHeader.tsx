
"use client";

import { Button } from "@/components/ui/button";
import { Leaf, Mail } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            Controlador de Composta
            <span className="text-sm text-muted-foreground ml-2">por Kubiotec</span>
          </h1>
        </div>
        <Button variant="outline" asChild>
          <a href="mailto:kubiotecmx@gmail.com">
            <Mail className="mr-2 h-4 w-4" />
            Contáctanos
          </a>
        </Button>
      </div>
    </header>
  );
}
