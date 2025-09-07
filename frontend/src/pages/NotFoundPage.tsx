import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { TriangleAlert } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <>
      <title>404 - Page Not Found</title>
      <meta
        name="description"
        content="The page you are looking for does not exist."
      />
      <link rel="canonical" href="/404" />
      <meta property="og:title" content="404 - Page Not Found" />
      <meta
        property="og:description"
        content="The page you are looking for does not exist."
      />
      <meta property="og:url" content="/404" />
      <meta property="og:type" content="website" />

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
              Oups ! La page que vous cherchez semble s'être égarée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Il se peut que le lien soit incorrect, obsolète, ou que la page
              ait été déplacée.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
