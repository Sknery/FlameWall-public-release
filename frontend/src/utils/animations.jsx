export const fadeInUp = {
  initial: {
    y: 20,    opacity: 0,  },
  animate: {
    y: 0,    opacity: 1,    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],    },
  },
};

export const listContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,    },
  },
};