export const motionPresets = {
  fadeInUp: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true, margin: '-50px' } },
  staggerChildren: { staggerChildren: 0.1, delayChildren: 0.1 },
  staggerItem: { opacity: 0, y: 20 },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }
};
