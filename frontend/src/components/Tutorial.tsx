import { useState, useEffect, useRef } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useColors } from '../contexts/ThemeContext';

interface TutorialStep {
  target: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
}

export function TutorialButton({ onStart }: { onStart: () => void }) {
  const COLORS = useColors();
  
  return (
    <button
      onClick={onStart}
      className="flex items-center space-x-2 px-4 py-2 rounded-md transition-all hover:opacity-80"
      style={{
        backgroundColor: COLORS.background.card,
        color: COLORS.text.primary,
        border: `1px solid ${COLORS.border}`,
      }}
      title="Lancer le tutoriel"
    >
      <HelpCircle size={18} />
      <span className="text-sm font-medium">Aide</span>
    </button>
  );
}

export function Tutorial({ steps, onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const COLORS = useColors();
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (currentStep >= steps.length) return;

      const step = steps[currentStep];
      const targetElement = document.querySelector(`[data-tutorial="${step.target}"]`);
      
      if (targetElement && bubbleRef.current) {
        const rect = targetElement.getBoundingClientRect();
        const bubbleRect = bubbleRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Mettre à jour la position du highlight
        setHighlightRect({
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          width: rect.width,
          height: rect.height,
        });
        
        let top = 0;
        let left = 0;
        let position: 'top' | 'bottom' | 'left' | 'right' = step.position || 'bottom';

        // Calculate position based on preferred placement
        switch (position) {
          case 'top':
            top = rect.top + scrollY - bubbleRect.height - 20;
            left = rect.left + scrollX + (rect.width / 2) - (bubbleRect.width / 2);
            break;
          case 'bottom':
            top = rect.bottom + scrollY + 20;
            left = rect.left + scrollX + (rect.width / 2) - (bubbleRect.width / 2);
            break;
          case 'left':
            top = rect.top + scrollY + (rect.height / 2) - (bubbleRect.height / 2);
            left = rect.left + scrollX - bubbleRect.width - 20;
            break;
          case 'right':
            top = rect.top + scrollY + (rect.height / 2) - (bubbleRect.height / 2);
            left = rect.right + scrollX + 20;
            break;
        }

        // Ensure bubble stays within viewport
        const margin = 20;
        if (left < margin) {
          left = margin;
        } else if (left + bubbleRect.width > window.innerWidth - margin) {
          left = window.innerWidth - bubbleRect.width - margin;
        }

        if (top < scrollY + margin) {
          top = scrollY + margin;
          position = 'bottom';
        }

        setBubblePosition({ top, left });
        setArrowPosition(position);
      }
    };

    updatePosition();
    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(updatePosition, 100);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleClose = () => {
    onComplete();
  };

  if (currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay avec découpe pour l'élément mis en évidence */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={handleClose}
      >
        {/* Zone découpée pour l'élément en surbrillance */}
        <div
          className="absolute"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.5)`,
            borderRadius: '8px',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Tutorial Bubble */}
      <div
        ref={bubbleRef}
        className="fixed z-50 rounded-lg shadow-2xl p-5 max-w-sm animate-in fade-in zoom-in-95"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
          border: `2px solid ${COLORS.accent.deepBlue}`,
          top: `${bubblePosition.top}px`,
          left: `${bubblePosition.left}px`,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-4 h-4 rotate-45"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.accent.deepBlue,
            ...(arrowPosition === 'top' && {
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              borderRight: `2px solid ${COLORS.accent.deepBlue}`,
              borderBottom: `2px solid ${COLORS.accent.deepBlue}`,
            }),
            ...(arrowPosition === 'bottom' && {
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              borderLeft: `2px solid ${COLORS.accent.deepBlue}`,
              borderTop: `2px solid ${COLORS.accent.deepBlue}`,
            }),
            ...(arrowPosition === 'left' && {
              right: '-10px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              borderTop: `2px solid ${COLORS.accent.deepBlue}`,
              borderRight: `2px solid ${COLORS.accent.deepBlue}`,
            }),
            ...(arrowPosition === 'right' && {
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              borderBottom: `2px solid ${COLORS.accent.deepBlue}`,
              borderLeft: `2px solid ${COLORS.accent.deepBlue}`,
            }),
          }}
        />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: COLORS.text.secondary }}
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="pr-6">
          <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.text.primary }}>
            {step.text}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: COLORS.text.muted }}>
              Étape {currentStep + 1} sur {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: COLORS.accent.deepBlue,
                color: 'white',
              }}
            >
              {currentStep < steps.length - 1 ? 'OK' : 'Terminer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}