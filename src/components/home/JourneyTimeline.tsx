import { useState } from 'react';
import { Check, ChevronRight, Play, Calendar, MapPin, Plane, Home, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { timelinePhases, getCurrentPhase, TimelinePhase, TimelineTask } from '@/data/timelineData';
import { cn } from '@/lib/utils';
import { useElderlyMode } from '@/contexts/ElderlyModeContext';

const phaseIcons: Record<string, React.ReactNode> = {
  'h-30': <Calendar className="w-4 h-4" />,
  'h-7': <Calendar className="w-4 h-4" />,
  'h-1': <Plane className="w-4 h-4" />,
  'during': <MapPin className="w-4 h-4" />,
  'after': <Home className="w-4 h-4" />,
};

const getPhaseIconsLarge = (id: string) => {
  const icons: Record<string, React.ReactNode> = {
    'h-30': <Calendar className="w-6 h-6" />,
    'h-7': <Calendar className="w-6 h-6" />,
    'h-1': <Plane className="w-6 h-6" />,
    'during': <MapPin className="w-6 h-6" />,
    'after': <Home className="w-6 h-6" />,
  };
  return icons[id];
};

interface PhaseCardProps {
  phase: TimelinePhase;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  completedTasks: Set<string>;
  onToggleTask: (taskId: string) => void;
}

const PhaseCard = ({ phase, isActive, isExpanded, onToggle, completedTasks, onToggleTask }: PhaseCardProps) => {
  const completedCount = phase.tasks.filter(t => completedTasks.has(t.id)).length;
  const progress = (completedCount / phase.tasks.length) * 100;

  return (
    <motion.div
      layout
      className={cn(
        "bg-card rounded-2xl border shadow-card overflow-hidden transition-all",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      {/* Phase Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
          phase.color
        )}>
          {phaseIcons[phase.id]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{phase.name}</h4>
            {isActive && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Saat Ini
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{phase.label}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm font-bold text-foreground">{completedCount}/{phase.tasks.length}</span>
            <Progress value={progress} className="w-12 h-1.5 mt-1" />
          </div>
          <ChevronRight className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {/* Expanded Tasks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">{phase.description}</p>
              
              {phase.tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCompleted={completedTasks.has(task.id)}
                  onToggle={() => onToggleTask(task.id)}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface TaskItemProps {
  task: TimelineTask;
  isCompleted: boolean;
  onToggle: () => void;
  index: number;
}

const TaskItem = ({ task, isCompleted, onToggle, index }: TaskItemProps) => {
  const priorityColors = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-amber-500/10 text-amber-600',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl transition-all",
        isCompleted ? "bg-primary/5" : "bg-secondary/50"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
          isCompleted 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {isCompleted && <Check className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h5 className={cn(
            "text-sm font-medium",
            isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {task.title}
          </h5>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            priorityColors[task.priority]
          )}>
            {task.priority === 'high' ? 'Penting' : task.priority === 'medium' ? 'Sedang' : 'Opsional'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {task.description}
        </p>
      </div>
    </motion.div>
  );
};

const JourneyTimeline = () => {
  const { isElderlyMode, fontSize, iconSize } = useElderlyMode();
  const currentPhase = getCurrentPhase();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(currentPhase?.id || 'h-7');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(['h30-1', 'h30-2']));

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Calculate overall progress
  const totalTasks = timelinePhases.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalCompleted = completedTasks.size;
  const overallProgress = (totalCompleted / totalTasks) * 100;

  const speakProgress = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Progress perjalanan umroh: ${totalCompleted} dari ${totalTasks} tugas selesai. ${Math.round(overallProgress)} persen.`
      );
      utterance.lang = 'id-ID';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`bg-secondary/50 border-t border-border ${isElderlyMode ? 'p-5 mt-5' : 'p-4 mt-4'}`}>
      {/* Header with overall progress */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-bold text-foreground ${fontSize.base}`}>Timeline Perjalanan</h3>
          <p className={`text-muted-foreground mt-0.5 ${fontSize.xs}`}>
            {totalCompleted} dari {totalTasks} tugas selesai
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isElderlyMode && (
            <button
              onClick={speakProgress}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label="Dengarkan progress"
            >
              <Volume2 style={{ width: iconSize.sm, height: iconSize.sm }} />
            </button>
          )}
          <span className={`font-medium text-primary ${fontSize.sm}`}>
            {Math.round(overallProgress)}%
          </span>
          <div className={isElderlyMode ? 'w-20' : 'w-16'}>
            <Progress value={overallProgress} className={isElderlyMode ? 'h-3' : 'h-2'} />
          </div>
        </div>
      </div>

      {/* Phase Pills - Horizontal scroll (simplified in elderly mode) */}
      <div className={`flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4 ${
        isElderlyMode ? 'gap-3' : ''
      }`}>
        {timelinePhases.map((phase) => {
          const isActive = currentPhase?.id === phase.id;
          const isSelected = expandedPhase === phase.id;
          
          return (
            <button
              key={phase.id}
              onClick={() => setExpandedPhase(phase.id === expandedPhase ? null : phase.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-all shrink-0",
                isElderlyMode ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/30"
              )}
            >
              {isElderlyMode ? getPhaseIconsLarge(phase.id) : phaseIcons[phase.id]}
              {phase.name}
            </button>
          );
        })}
      </div>

      {/* Phase Cards - Show only expanded in elderly mode for simplicity */}
      <div className="space-y-3">
        {timelinePhases
          .filter(phase => isElderlyMode ? expandedPhase === phase.id : true)
          .map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isActive={currentPhase?.id === phase.id}
            isExpanded={expandedPhase === phase.id}
            onToggle={() => setExpandedPhase(phase.id === expandedPhase ? null : phase.id)}
            completedTasks={completedTasks}
            onToggleTask={toggleTask}
          />
        ))}
      </div>

      {/* Quick Action - Larger in elderly mode */}
      {currentPhase && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-primary/5 rounded-2xl border border-primary/20 ${
            isElderlyMode ? 'mt-5 p-5' : 'mt-4 p-4'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className={`text-muted-foreground ${fontSize.xs}`}>Tugas berikutnya</p>
              <h4 className={`font-bold text-foreground mt-0.5 ${fontSize.sm}`}>
                {currentPhase.tasks.find(t => !completedTasks.has(t.id))?.title || 'Semua selesai! 🎉'}
              </h4>
            </div>
            <Button 
              size={isElderlyMode ? 'lg' : 'sm'} 
              className={`shadow-primary gap-1.5 ${isElderlyMode ? 'h-14 px-6' : ''}`}
            >
              <Play style={{ width: isElderlyMode ? 20 : 12, height: isElderlyMode ? 20 : 12 }} /> 
              <span className={fontSize.sm}>Mulai</span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default JourneyTimeline;
