import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  SiteBuilderContextType, 
  SiteBuilderStep, 
  StepData,
  AuthState,
  User,
  Tenant 
} from '../types';
import { toast } from 'react-hot-toast';

// Define the steps for the site builder
const initialSteps: SiteBuilderStep[] = [
  {
    id: 1,
    title: 'Choose Subdomain',
    description: 'Pick your unique subdomain and site name',
    component: 'SubdomainStep',
    isComplete: false,
    isActive: true,
  },
  {
    id: 2,
    title: 'Upload Photos',
    description: 'Add slideshow images for your site',
    component: 'PhotoUploadStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 3,
    title: 'Parent Information',
    description: 'Enter details about the expecting parents',
    component: 'ParentInfoStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 4,
    title: 'Venmo Setup',
    description: 'Configure payment collection via Venmo',
    component: 'VenmoStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 5,
    title: 'Admin Settings',
    description: 'Set password and notification preferences',
    component: 'AdminStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 6,
    title: 'Preview Site',
    description: 'Review your site before going live',
    component: 'PreviewStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 7,
    title: 'Payment',
    description: 'Complete payment to activate your site',
    component: 'PaymentStep',
    isComplete: false,
    isActive: false,
  },
  {
    id: 8,
    title: 'Deploy',
    description: 'Your site is being deployed!',
    component: 'DeployStep',
    isComplete: false,
    isActive: false,
  },
];

// Action types
type SiteBuilderAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'UPDATE_STEP_DATA'; payload: { step: number; data: any } }
  | { type: 'MARK_STEP_COMPLETE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_BUILDER' }
  | { type: 'LOAD_PROGRESS'; payload: { steps: SiteBuilderStep[]; stepData: StepData; currentStep: number } }
  | { type: 'SET_AUTH_STATE'; payload: AuthState };

// Initial state
interface SiteBuilderState extends SiteBuilderContextType {
  auth: AuthState;
}

const initialState: SiteBuilderState = {
  steps: initialSteps,
  currentStep: 1,
  stepData: {},
  isLoading: false,
  error: null,
  auth: {
    user: null,
    tenant: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  },
  // These will be set by the reducer
  setCurrentStep: () => {},
  updateStepData: () => {},
  nextStep: () => {},
  previousStep: () => {},
  resetBuilder: () => {},
  saveProgress: async () => {},
  loadProgress: async () => {},
};

// Reducer function
function siteBuilderReducer(state: SiteBuilderState, action: SiteBuilderAction): SiteBuilderState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
        steps: state.steps.map((step, index) => ({
          ...step,
          isActive: index === action.payload - 1,
        })),
      };

    case 'UPDATE_STEP_DATA':
      return {
        ...state,
        stepData: {
          ...state.stepData,
          [`step${action.payload.step}`]: {
            ...state.stepData[`step${action.payload.step}` as keyof StepData],
            ...action.payload.data,
          },
        },
      };

    case 'MARK_STEP_COMPLETE':
      return {
        ...state,
        steps: state.steps.map((step) =>
          step.id === action.payload
            ? { ...step, isComplete: true }
            : step
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'RESET_BUILDER':
      return {
        ...initialState,
        auth: state.auth, // Preserve auth state
        steps: initialSteps,
      };

    case 'LOAD_PROGRESS':
      return {
        ...state,
        steps: action.payload.steps,
        stepData: action.payload.stepData,
        currentStep: action.payload.currentStep,
        isLoading: false,
      };

    case 'SET_AUTH_STATE':
      return {
        ...state,
        auth: action.payload,
      };

    default:
      return state;
  }
}

// Create the context
const SiteBuilderContext = createContext<SiteBuilderState>(initialState);

// Progress storage keys
const PROGRESS_STORAGE_KEY = 'site_builder_progress';
const AUTH_STORAGE_KEY = 'site_builder_auth';

// Provider component
export function SiteBuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(siteBuilderReducer, initialState);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          dispatch({
            type: 'SET_AUTH_STATE',
            payload: {
              ...authData,
              isLoading: false,
            },
          });
        } else {
          dispatch({
            type: 'SET_AUTH_STATE',
            payload: {
              ...initialState.auth,
              isLoading: false,
            },
          });
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            ...initialState.auth,
            isLoading: false,
          },
        });
      }
    };

    loadAuthState();
  }, []);

  // Auto-save progress when stepData changes
  useEffect(() => {
    if (Object.keys(state.stepData).length > 0 && !state.isLoading) {
      saveProgressToStorage();
    }
  }, [state.stepData, state.currentStep, state.steps]);

  // Save progress to localStorage
  const saveProgressToStorage = () => {
    try {
      const progressData = {
        steps: state.steps,
        stepData: state.stepData,
        currentStep: state.currentStep,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    }
  };

  // Action creators
  const setCurrentStep = (step: number) => {
    if (step >= 1 && step <= state.steps.length) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    }
  };

  const updateStepData = (step: number, data: any) => {
    dispatch({ type: 'UPDATE_STEP_DATA', payload: { step, data } });
  };

  const nextStep = () => {
    if (state.currentStep < state.steps.length) {
      // Mark current step as complete
      dispatch({ type: 'MARK_STEP_COMPLETE', payload: state.currentStep });
      
      // Move to next step
      const nextStepNumber = state.currentStep + 1;
      dispatch({ type: 'SET_CURRENT_STEP', payload: nextStepNumber });
      
      toast.success(`Step ${state.currentStep} completed!`);
    }
  };

  const previousStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  const resetBuilder = () => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    dispatch({ type: 'RESET_BUILDER' });
    toast.success('Site builder reset');
  };

  const saveProgress = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      saveProgressToStorage();
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save progress' });
      toast.error('Failed to save progress');
    }
  };

  const loadProgress = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const storedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (storedProgress) {
        const progressData = JSON.parse(storedProgress);
        
        // Validate the data structure
        if (progressData.steps && progressData.stepData && progressData.currentStep) {
          dispatch({
            type: 'LOAD_PROGRESS',
            payload: {
              steps: progressData.steps,
              stepData: progressData.stepData,
              currentStep: progressData.currentStep,
            },
          });
          toast.success('Progress loaded successfully');
        } else {
          throw new Error('Invalid progress data structure');
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        toast.info('No saved progress found');
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load progress' });
      toast.error('Failed to load progress');
    }
  };

  // Auth helpers
  const setAuthState = (authData: Partial<AuthState>) => {
    const newAuthState = { ...state.auth, ...authData };
    dispatch({ type: 'SET_AUTH_STATE', payload: newAuthState });
    
    // Save to localStorage (excluding sensitive data in production)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: newAuthState.user,
        tenant: newAuthState.tenant,
        token: newAuthState.token,
        isAuthenticated: newAuthState.isAuthenticated,
      }));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    dispatch({ type: 'SET_AUTH_STATE', payload: initialState.auth });
    dispatch({ type: 'RESET_BUILDER' });
    toast.success('Logged out successfully');
  };

  const contextValue: SiteBuilderState = {
    ...state,
    setCurrentStep,
    updateStepData,
    nextStep,
    previousStep,
    resetBuilder,
    saveProgress,
    loadProgress,
    // Additional auth methods
    setAuthState,
    logout,
  };

  return (
    <SiteBuilderContext.Provider value={contextValue}>
      {children}
    </SiteBuilderContext.Provider>
  );
}

// Custom hook to use the context
export function useSiteBuilder() {
  const context = useContext(SiteBuilderContext);
  if (!context) {
    throw new Error('useSiteBuilder must be used within a SiteBuilderProvider');
  }
  return context;
}

// Additional hooks for specific functionality
export function useAuth() {
  const { auth, setAuthState, logout } = useSiteBuilder();
  return { ...auth, setAuthState, logout };
}

export function useCurrentStep() {
  const { currentStep, steps, setCurrentStep, nextStep, previousStep } = useSiteBuilder();
  const currentStepData = steps.find(step => step.id === currentStep);
  
  return {
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    progress: (currentStep / steps.length) * 100,
    canGoNext: currentStep < steps.length,
    canGoPrevious: currentStep > 1,
    setCurrentStep,
    nextStep,
    previousStep,
  };
}

export function useStepData<T = any>(stepNumber: number) {
  const { stepData, updateStepData } = useSiteBuilder();
  const data = stepData[`step${stepNumber}` as keyof StepData] as T;
  
  return {
    data,
    updateData: (newData: Partial<T>) => updateStepData(stepNumber, newData),
    setData: (newData: T) => updateStepData(stepNumber, newData),
    hasData: data !== undefined,
  };
}

export default SiteBuilderContext;