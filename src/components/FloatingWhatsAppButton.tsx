import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { trackWhatsAppClick } from "@/utils/analytics";

const FloatingWhatsAppButton = () => {
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de criar meu site profissional com a HabiFy");
  const whatsappLink = `https://wa.me/5511911103963?text=${whatsappMessage}`;

  const handleClick = () => {
    trackWhatsAppClick('floating-button');
  };

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Falar no WhatsApp"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <MessageCircle className="w-7 h-7" />
      </motion.div>
      
      {/* Pulse effect (lighter than animate-ping for performance) */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-50 animate-pulse" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Fale com um especialista
      </span>
    </motion.a>
  );
};

export default FloatingWhatsAppButton;
