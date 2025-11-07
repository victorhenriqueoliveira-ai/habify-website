import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="text-center max-w-2xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logotipo_habify.png" 
            alt="Habify" 
            className="h-16 w-auto opacity-90"
          />
        </div>

        {/* 404 Icon */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[180px] font-bold text-primary/20 leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 md:w-24 md:h-24 text-primary/40 animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Página não encontrada
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
          <p className="text-sm text-muted-foreground/80">
            URL solicitada: <code className="text-primary font-mono">{location.pathname}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-5 w-5" />
            Voltar para Home
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-muted-foreground">
          Precisa de ajuda? Entre em contato com o{" "}
          <a 
            href="mailto:contato@habify.com.br" 
            className="text-primary hover:underline"
          >
            suporte
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
