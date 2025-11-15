import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';

interface VideoTestimonialProps {
  thumbnail: string;
  videoUrl?: string;
  author: string;
  role: string;
  rating: number;
  quote: string;
}

const VideoTestimonial: React.FC<VideoTestimonialProps> = ({
  thumbnail,
  videoUrl,
  author,
  role,
  rating,
  quote
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-border"
    >
      {/* Video/Thumbnail */}
      <div className="relative aspect-video bg-muted group cursor-pointer">
        <img
          src={thumbnail}
          alt={author}
          className="w-full h-full object-cover"
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl"
              onClick={() => setIsPlaying(true)}
            >
              <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
            </motion.button>
          </div>
        )}

        {/* Overlay badge */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-muted-foreground italic mb-4 line-clamp-3">
          "{quote}"
        </p>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
            {author.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{author}</h4>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoTestimonial;
