import { MapPin, Clock, Phone, Users, ChevronRight } from 'lucide-react';
import { Chantier, User } from '../../types';
import { formatTime, formatRelativeDate, getStatusLabel, getStatusBadgeClass, getInitials, getTechnicianColor } from '../../utils/helpers';

interface ChantierCardProps {
  chantier: Chantier;
  technicians?: User[];
  onClick?: () => void;
  showTechnicians?: boolean;
  compact?: boolean;
}

export function ChantierCard({ 
  chantier, 
  technicians = [], 
  onClick, 
  showTechnicians = true,
  compact = false 
}: ChantierCardProps) {
  const statusClass = chantier.status === 'a_venir' 
    ? 'chantier-card-upcoming' 
    : chantier.status === 'en_cours' 
      ? 'chantier-card-inprogress' 
      : 'chantier-card-completed';

  const assignedTechs = technicians.filter(t => chantier.technicianIds.includes(t.id));

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`chantier-card ${statusClass} p-4 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 truncate">{chantier.clientName}</h4>
            <p className="text-sm text-gray-500 truncate">{chantier.workType}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={`badge ${getStatusBadgeClass(chantier.status)} text-xs`}>
              {getStatusLabel(chantier.status)}
            </span>
            {onClick && <ChevronRight size={20} className="text-gray-400" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`chantier-card ${statusClass} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-lg text-gray-800 truncate">
              {chantier.clientName}
            </h3>
          </div>
          <p className="text-btp-600 font-medium">{chantier.workType}</p>
        </div>
        <span className={`badge ${getStatusBadgeClass(chantier.status)}`}>
          {getStatusLabel(chantier.status)}
        </span>
      </div>

      {/* Infos */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3 text-gray-600">
          <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm leading-snug">{chantier.address}</span>
        </div>
        
        <div className="flex items-center gap-3 text-gray-600">
          <Clock size={18} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm">
            {formatRelativeDate(chantier.startDatetime)} • {formatTime(chantier.startDatetime)} - {formatTime(chantier.endDatetime)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-600">
          <Phone size={18} className="text-gray-400 flex-shrink-0" />
          <a 
            href={`tel:${chantier.clientPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-btp-600 hover:underline"
          >
            {chantier.clientPhone}
          </a>
        </div>
      </div>

      {/* Techniciens */}
      {showTechnicians && assignedTechs.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <div className="flex -space-x-2">
              {assignedTechs.slice(0, 4).map((tech, index) => (
                <div
                  key={tech.id}
                  className={`w-8 h-8 rounded-full ${getTechnicianColor(index)} text-white text-xs font-semibold flex items-center justify-center border-2 border-white`}
                  title={tech.name}
                >
                  {getInitials(tech.name)}
                </div>
              ))}
              {assignedTechs.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 text-xs font-semibold flex items-center justify-center border-2 border-white">
                  +{assignedTechs.length - 4}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              {assignedTechs.map(t => t.name.split(' ')[0]).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {chantier.notes && (
        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">{chantier.notes}</p>
        </div>
      )}

      {/* Action indicator */}
      {onClick && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ChevronRight size={24} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}
