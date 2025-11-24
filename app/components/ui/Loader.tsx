import { Loader2 } from 'lucide-react'; // Importe une icône de spinner

interface LoaderProps {
  message?: string; // Message optionnel
  spinnerSize?: number; // Taille optionnelle pour le spinner
  textSize?: string; // Taille optionnelle pour le texte (ex: 'text-sm', 'text-lg')
}

function Loader({
  message = 'Chargement...', // Message par défaut
  spinnerSize = 8, // Taille par défaut du spinner (h-8 w-8)
  textSize = 'text-base', // Taille par défaut du texte
}: LoaderProps) {
  const spinnerClasses = `h-${spinnerSize} w-${spinnerSize}`;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm absolute inset-0 z-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2
          className={`${spinnerClasses} animate-spin text-primary`}
          // Utilise text-primary de Shadcn pour la couleur principale
        />
        <p className={`text-muted-foreground animate-pulse ${textSize}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default Loader;
