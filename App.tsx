import React, { useState, useEffect } from 'react';
import { History, Delete, X, Moon, Sun, Calculator as CalcIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Operator = '+' | '-' | '×' | '÷' | null;

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

// --- Components ---

// 1. Button Component
interface CalculatorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  size?: 'default' | 'large';
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className, 
  ...props 
}) => {
  const variants = {
    default: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100",
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]",
    secondary: "bg-zinc-200 hover:bg-zinc-100 text-zinc-900",
    accent: "bg-amber-500 hover:bg-amber-400 text-white",
  };

  return (
    <button
      className={cn(
        "relative flex items-center justify-center rounded-2xl text-xl font-medium transition-all duration-200 active:scale-95",
        size === 'large' ? "col-span-2 aspect-[2.1/1]" : "aspect-square",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// 2. Global Styles Component (Replaces index.css)
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    body { margin: 0; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    * { box-sizing: border-box; }
    
    /* Custom Scrollbar for History */
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.3);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.5);
    }
  `}</style>
);

// 3. Main Application
export default function App() {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Helper to format numbers with commas and limit length
  const formatDisplay = (val: string) => {
    if (val === 'Error') return 'Error';
    if (val === 'NaN') return 'Error';
    
    // Handle exponential notation for very large/small numbers
    const num = parseFloat(val);
    if (Math.abs(num) > 999999999 || (Math.abs(num) < 0.0000001 && num !== 0)) {
      return num.toExponential(4);
    }
    
    // Limit decimal places
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const inputPercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const performOperation = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(String(inputValue));
    } else if (operator) {
      const currentValue = prevValue ? parseFloat(prevValue) : 0;
      const newValue = calculate(currentValue, inputValue, operator);
      
      setPrevValue(String(newValue));
      setDisplay(String(newValue));
      
      // Add to history
      addToHistory(currentValue, inputValue, operator, newValue);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prev: number, next: number, op: Operator): number => {
    switch (op) {
      case '+': return prev + next;
      case '-': return prev - next;
      case '×': return prev * next;
      case '÷': return next === 0 ? 0 : prev / next; // Handle div by zero gracefully
      default: return next;
    }
  };

  const addToHistory = (a: number, b: number, op: string, result: number) => {
    const newEntry: HistoryItem = {
      id: Date.now().toString(),
      expression: `${parseFloat(a.toPrecision(10))} ${op} ${parseFloat(b.toPrecision(10))}`,
      result: String(parseFloat(result.toPrecision(10)))
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      
      if (/\d/.test(key)) {
        e.preventDefault();
        inputDigit(key);
      } else if (key === '.') {
        e.preventDefault();
        inputDot();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        if (operator) {
           performOperation(null);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        clear();
      } else if (key === '+') {
        e.preventDefault();
        performOperation('+');
      } else if (key === '-') {
        e.preventDefault();
        performOperation('-');
      } else if (key === '*') {
        e.preventDefault();
        performOperation('×');
      } else if (key === '/') {
        e.preventDefault();
        performOperation('÷');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, prevValue, operator, waitingForOperand]);

  // Theme Toggle
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <GlobalStyles />
      <div className={cn(
        "min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-500 font-sans",
        theme === 'dark' 
          ? "bg-zinc-950 text-white selection:bg-indigo-500/30" 
          : "bg-zinc-100 text-zinc-900 selection:bg-indigo-500/20"
      )}>
        
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-20 transition-colors duration-700",
            theme === 'dark' ? "bg-indigo-600" : "bg-indigo-400"
          )} />
          <div className={cn(
            "absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 transition-colors duration-700",
            theme === 'dark' ? "bg-purple-600" : "bg-blue-400"
          )} />
        </div>

        {/* Main Container */}
        <div className={cn(
          "relative w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-3xl border transition-colors duration-300",
          theme === 'dark' 
            ? "bg-black/40 border-white/10 shadow-black/50" 
            : "bg-white/60 border-white/40 shadow-xl ring-1 ring-black/5"
        )}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex items-center gap-2 opacity-50">
              <CalcIcon size={16} />
              <span className="text-xs font-medium tracking-wider uppercase">Lumina</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={toggleTheme}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  theme === 'dark' ? "hover:bg-white/10 text-zinc-400" : "hover:bg-black/5 text-zinc-500"
                )}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "p-2 rounded-full transition-colors relative",
                  theme === 'dark' 
                    ? "hover:bg-white/10 text-zinc-400" 
                    : "hover:bg-black/5 text-zinc-500",
                  showHistory && "text-indigo-500 bg-indigo-500/10"
                )}
              >
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="px-6 py-8 flex flex-col items-end justify-end h-40">
            <div className="text-sm opacity-50 font-mono h-6 mb-1">
              {prevValue} {operator}
            </div>
            <div className={cn(
              "text-6xl font-light tracking-tight w-full text-right overflow-hidden text-ellipsis whitespace-nowrap transition-all",
              display.length > 8 && "text-4xl",
              display.length > 12 && "text-3xl"
            )}>
              {formatDisplay(display)}
            </div>
          </div>

          {/* Keypad */}
          <div className={cn(
            "p-6 grid grid-cols-4 gap-3 rounded-t-[2.5rem] transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-900/50" : "bg-white/50"
          )}>
            {/* Row 1 */}
            <CalculatorButton 
              variant="secondary" 
              onClick={clear}
              className={theme === 'light' ? "bg-white hover:bg-zinc-50 shadow-sm" : ""}
            >
              {display === '0' && !prevValue ? 'AC' : 'C'}
            </CalculatorButton>
            <CalculatorButton 
              variant="secondary" 
              onClick={toggleSign}
              className={theme === 'light' ? "bg-white hover:bg-zinc-50 shadow-sm" : ""}
            >
              ±
            </CalculatorButton>
            <CalculatorButton 
              variant="secondary" 
              onClick={inputPercent}
              className={theme === 'light' ? "bg-white hover:bg-zinc-50 shadow-sm" : ""}
            >
              %
            </CalculatorButton>
            <CalculatorButton 
              variant="primary" 
              onClick={() => performOperation('÷')}
              className={operator === '÷' ? "ring-2 ring-indigo-300 ring-offset-2 ring-offset-zinc-900" : ""}
            >
              ÷
            </CalculatorButton>

            {/* Row 2 */}
            <CalculatorButton onClick={() => inputDigit('7')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>7</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('8')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>8</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('9')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>9</CalculatorButton>
            <CalculatorButton 
              variant="primary" 
              onClick={() => performOperation('×')}
              className={operator === '×' ? "ring-2 ring-indigo-300 ring-offset-2 ring-offset-zinc-900" : ""}
            >
              ×
            </CalculatorButton>

            {/* Row 3 */}
            <CalculatorButton onClick={() => inputDigit('4')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>4</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('5')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>5</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('6')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>6</CalculatorButton>
            <CalculatorButton 
              variant="primary" 
              onClick={() => performOperation('-')}
              className={operator === '-' ? "ring-2 ring-indigo-300 ring-offset-2 ring-offset-zinc-900" : ""}
            >
              −
            </CalculatorButton>

            {/* Row 4 */}
            <CalculatorButton onClick={() => inputDigit('1')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>1</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('2')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>2</CalculatorButton>
            <CalculatorButton onClick={() => inputDigit('3')} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>3</CalculatorButton>
            <CalculatorButton 
              variant="primary" 
              onClick={() => performOperation('+')}
              className={operator === '+' ? "ring-2 ring-indigo-300 ring-offset-2 ring-offset-zinc-900" : ""}
            >
              +
            </CalculatorButton>

            {/* Row 5 */}
            <CalculatorButton 
              size="large" 
              onClick={() => inputDigit('0')} 
              className={cn(
                "pl-8 justify-start",
                theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""
              )}
            >
              0
            </CalculatorButton>
            <CalculatorButton onClick={inputDot} className={theme === 'light' ? "bg-white text-zinc-900 hover:bg-zinc-50" : ""}>.</CalculatorButton>
            <CalculatorButton 
              variant="primary" 
              onClick={() => performOperation(null)}
              className="bg-gradient-to-br from-indigo-500 to-purple-600"
            >
              =
            </CalculatorButton>
          </div>

          {/* History Overlay */}
          <div className={cn(
            "absolute inset-0 z-20 backdrop-blur-xl transition-all duration-300 transform",
            theme === 'dark' ? "bg-zinc-900/90" : "bg-white/90",
            showHistory ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          )}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold">History</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 h-[calc(100%-80px)] overflow-y-auto space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 gap-3">
                  <History size={48} />
                  <p>No calculations yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all active:scale-95",
                      theme === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-zinc-100 hover:bg-zinc-200"
                    )}
                    onClick={() => {
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                  >
                    <div className="text-sm opacity-60 mb-1">{item.expression}</div>
                    <div className="text-xl font-medium text-indigo-500">= {item.result}</div>
                  </div>
                ))
              )}
            </div>
            {history.length > 0 && (
              <div className="absolute bottom-6 right-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setHistory([]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full text-sm font-medium transition-colors"
                >
                  <Delete size={14} /> Clear
                </button>
              </div>
            )}
          </div>

        </div>
        
        {/* Keyboard Shortcuts Hint */}
        <div className="fixed bottom-6 text-xs opacity-30 hidden md:block">
          Keyboard supported • Esc to clear • Backspace to delete
        </div>
      </div>
    </>
  );
}