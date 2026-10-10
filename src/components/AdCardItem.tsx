import React, { useState } from 'react';
import { ExternalLink, Tag, Sparkles } from 'lucide-react';
import { AdCard } from '../types';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_AD_IMAGE = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';

interface AdCardItemProps {
  card: AdCard;
}

export const AdCardItem: React.FC<AdCardItemProps> = ({ card }) => {
  const { language, t } = useAuth();

  const displayTitle = (language === 'bn' && card.titleBn) ? card.titleBn : card.title;
  const displayDesc = (language === 'bn' && card.descriptionBn) ? card.descriptionBn : card.description;

  const handleCardClick = () => {
    if (card.destinationUrl) window.open(card.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group bg-[#0f172a] hover:bg-[#131c36] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg hover:shadow-emerald-950/20 cursor-pointer"
      >
        {/* Card Thumbnail Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img 
            src={card.imageUrl || DEFAULT_AD_IMAGE} 
            alt={displayTitle}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          {/* Category Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-sm">
            <Tag className="w-3 h-3 text-emerald-400" />
            <span>{card.category}</span>
          </div>

          {/* Sponsored Badge */}
          {card.isSponsored && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/90 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
              <Sparkles className="w-3 h-3" />
              <span>{t('sponsoredBadge')}</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 mb-2">
              {displayTitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4">
              {displayDesc}
            </p>
          </div>

          {/* Bottom Footer Action */}
          <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              {card.isSponsored ? t('sponsoredBadge') : t('partnerAdBadge')}
            </span>
            <div className="text-emerald-400 group-hover:text-emerald-300 font-bold flex items-center gap-1">
              <span>{t('visitSponsor')}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
