"use client";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <TriangleAlert className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold">
            404 - Page Non Trouvée
          </CardTitle>
          <CardDescription>
            Oups ! La page que vous cherchez semble s&apos;être égarée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Il se peut que le lien soit incorrect, obsolète, ou que la page ait
            été déplacée.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
