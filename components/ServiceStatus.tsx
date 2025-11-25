import React, { useState } from 'react';
import { ServiceHealth } from '../types';
import * as Icons from 'lucide-react';
import GlassCard from './GlassCard';
import { Edit2, Check, Eye, EyeOff, Plus, Save, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ServiceStatusProps {
  services: ServiceHealth[];
  onToggleService: (name: string) => void;
  onAddService: (service: { name: string; url: string; icon: string }) => void;
  onReorder: (newOrder: string[]) => void;
}

// Sortable Item Component
const SortableServiceCard = ({ service, isEditing, onToggleService, getIcon, getStatusColor }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: service.name, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const CardContent = (
    <GlassCard className={`h-full transition-all duration-300 group relative overflow-hidden ${isEditing
      ? 'cursor-grab active:cursor-grabbing border-dashed bg-slate-900/60'
      : 'hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/60'
      } ${!service.enabled && isEditing ? 'opacity-50 grayscale' : ''}`}>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {isEditing && (
            <div className="text-gray-500 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
              <GripVertical size={16} />
            </div>
          )}
          <div className={`p-2.5 rounded-xl transition-colors shrink-0 shadow-inner ${isEditing
            ? service.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'
            : 'bg-white/5 text-blue-200 group-hover:bg-blue-500/20 group-hover:text-blue-300'
            }`}>
            {getIcon(service.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm text-gray-200 truncate group-hover:text-white transition-colors">{service.name}</div>
            {isEditing ? (
              <div className={`text-[10px] font-medium uppercase tracking-wide mt-0.5 ${service.enabled ? 'text-emerald-500' : 'text-gray-500'}`}>
                {service.enabled ? 'Visible' : 'Hidden'}
              </div>
            ) : (
              <div className="mt-0.5">
                {service.displayMetric ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                    {service.displayMetric}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{service.latency}ms latency</span>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${service.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag start
              onToggleService(service.name);
            }}
          >
            {service.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
          </div>
        ) : (
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(service.status)} ring-2 ring-slate-900/50`} />
        )}
      </div>

      {!isEditing && service.status === 'up' && (
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
      )}
    </GlassCard>
  );

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      {isEditing ? (
        <div className="h-full">
          {CardContent}
        </div>
      ) : (
        <a
          href={service.url}
          target="_blank"
          rel="noreferrer"
          className="block group h-full"
        >
          {CardContent}
        </a>
      )}
    </div>
  );
};

const ServiceStatus: React.FC<ServiceStatusProps> = ({ services, onToggleService, onAddService, onReorder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', url: 'http://' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getIcon = (iconName: string) => {
    // @ts-ignore - Dynamic icon lookup
    const Icon = Icons[iconName] || Icons.Box;
    return <Icon size={20} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'degraded': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case 'down': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      default: return 'bg-gray-500';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.name === active.id);
      const newIndex = services.findIndex((s) => s.name === over.id);

      const newServices = arrayMove(services, oldIndex, newIndex);
      onReorder(newServices.map(s => s.name));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.url) {
      onAddService({ ...newService, icon: 'Server' });
      setNewService({ name: '', url: 'http://' });
      setShowAddForm(false);
    }
  };

  const displayedServices = isEditing ? services : services.filter(s => s.enabled);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end px-2">
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setShowAddForm(false);
          }}
          className={`px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-2 ${isEditing ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          {isEditing ? <><Check size={14} /> Done Editing</> : <><Edit2 size={14} /> Manage Cards</>}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={displayedServices.map(s => s.name)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedServices.map((service) => (
              <SortableServiceCard
                key={service.name}
                service={service}
                isEditing={isEditing}
                onToggleService={onToggleService}
                getIcon={getIcon}
                getStatusColor={getStatusColor}
              />
            ))}

            {isEditing && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 border-dashed border-2 border-gray-700 hover:border-gray-500 hover:bg-white/5 hover:text-gray-300 transition-all h-full min-h-[88px] group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-medium">Add Service</span>
              </button>
            )}

            {isEditing && showAddForm && (
              <GlassCard className="h-full border-blue-500/30 bg-slate-900/80">
                <form onSubmit={handleAddSubmit} className="flex flex-col h-full justify-between gap-2">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Service Name"
                      value={newService.name}
                      onChange={e => setNewService({ ...newService, name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="http://ip:port"
                      value={newService.url}
                      onChange={e => setNewService({ ...newService, url: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
                      <Save size={12} /> Save
                    </button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded text-xs transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </form>
              </GlassCard>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ServiceStatus;