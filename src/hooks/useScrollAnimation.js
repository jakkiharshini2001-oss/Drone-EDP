import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-based animations
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visible before triggering (0-1)
 * @param {string} options.rootMargin - Margin around root element
 * @param {boolean} options.triggerOnce - Whether to trigger animation only once
 * @returns {Object} - ref to attach to element and isVisible state
 */
export const useScrollAnimation = (options = {}) => {
    const {
        threshold = 0.1,
        rootMargin = '0px',
        triggerOnce = true
    } = options;

    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, isVisible };
};

/**
 * Hook for staggered list animations
 * @param {number} itemCount - Number of items in the list
 * @param {number} staggerDelay - Delay between each item (ms)
 * @returns {Function} - Function to get animation class for each item
 */
export const useStaggerAnimation = (itemCount, staggerDelay = 100) => {
    const getItemClass = (index) => {
        const delay = index * staggerDelay;
        return {
            style: { animationDelay: `${delay}ms` },
            className: 'animate-fade-in-up'
        };
    };

    return getItemClass;
};

export default useScrollAnimation;
