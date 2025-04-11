// Type declarations for various libraries and modules

// For CSS imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// For Bootstrap CSS
declare module 'bootstrap/dist/css/bootstrap.min.css';

// Fix React types
declare namespace React {
  interface FormEvent<T = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
  }
  
  interface ChangeEvent<T = Element> {
    target: EventTarget & T;
    preventDefault(): void;
  }
  
  interface EventTarget {
    value?: string;
    name?: string;
    checked?: boolean;
  }
}

// Declare ForgotPasswordRequest interface if needed
interface ForgotPasswordRequest {
  email: string;
}
