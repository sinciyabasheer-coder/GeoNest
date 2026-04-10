import { useEffect, useRef, useState } from "react";

function SectionReveal({ children, className = "", as: Tag = "section", ...props }) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={elementRef}
      className={`reveal ${isVisible ? "reveal--visible" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default SectionReveal;
