// src/components/OnboardingModal.tsx
import { useState } from 'react';

interface OnboardingProps {
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to Your AI Assistant!',
    content: 'This is a smart chatbot that can help you with a variety of questions. Let\'s quickly go over the unique features.'
  },
  {
    title: 'Clarification Threads',
    content: 'See the blue (?) icon next to a bot\'s reply? Click it to open a private thread to ask for more details about that specific message, without cluttering your main conversation!'
  },
  {
    title: 'You\'re All Set!',
    content: 'That\'s it! You can now start a new conversation or explore your existing ones. Enjoy your AI assistant.'
  }
];

export function OnboardingModal({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      onClose(); // Finish on the last step
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '500px', height: 'auto'}}>
        <div className="modal-header">
          <p>{tutorialSteps[step].title}</p>
        </div>
        <div style={{padding: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6'}}>
          {tutorialSteps[step].content}
        </div>
        <div style={{padding: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)'}}>
          <button onClick={onClose} style={{background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-color)'}}>Skip</button>
          <button onClick={handleNext}>
            {step < tutorialSteps.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );
}