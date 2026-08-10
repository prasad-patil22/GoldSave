import React, { useState, useEffect } from 'react';
import { HelpCircle, AlertTriangle } from 'lucide-react';

const DoubleConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "Do you want to proceed with this action?",
  actionType = "danger", // "danger", "warning", "info", "success"
  showCheckbox = false,
  checkboxLabel = "Send WhatsApp Notification",
  checkboxDefaultChecked = true,
}) => {
  const [step, setStep] = useState(1);
  const [isChecked, setIsChecked] = useState(checkboxDefaultChecked);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsChecked(checkboxDefaultChecked);
    }
  }, [isOpen, checkboxDefaultChecked]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    onConfirm(isChecked);
    onClose();
  };

  const getThemeClasses = () => {
    switch (actionType) {
      case 'danger':
        return {
          icon: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-slate-950',
        };
      case 'success':
        return {
          icon: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-slate-950',
        };
      case 'warning':
      default:
        return {
          icon: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          confirmBtn: 'bg-gold-500 hover:bg-gold-400 text-slate-950',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-2xl text-center space-y-5 animate-scale-in">
        
        {/* Header Icon */}
        <div className={`mx-auto w-12 h-12 rounded-full border flex items-center justify-center ${step === 1 ? 'text-gold-500 bg-gold-500/10 border-gold-500/20' : theme.icon}`}>
          {step === 1 ? (
            <HelpCircle className="w-6 h-6 animate-pulse" />
          ) : (
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            {step === 1 ? title : "Are you absolutely sure?"}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            {step === 1 
              ? message 
              : "This action cannot be undone. Do you really want to continue?"}
          </p>
        </div>

        {/* Optional Notification Checkbox (Only on Step 1) */}
        {showCheckbox && step === 1 && (
          <div className="flex items-center justify-center gap-2 bg-slate-900/40 border border-slate-900 py-2.5 px-3 rounded-lg w-fit mx-auto">
            <input
              type="checkbox"
              id="confirm-notify-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-gold-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="confirm-notify-checkbox" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none">
              {checkboxLabel}
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 py-2.5 gold-btn-gradient text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-gold-500/10 active:scale-95 transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalConfirm}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-all ${theme.confirmBtn}`}
            >
              Confirm
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default DoubleConfirmModal;
