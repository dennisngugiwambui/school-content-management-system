import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../components/layout/PageHeader';
import { Icon } from '../components/ui';

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="The page you are looking for may have been moved or no longer exists." />
      <section className="section text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="font-heading text-[7rem] md:text-[10rem] font-extrabold leading-none text-gradient">404</motion.div>
        <Link to="/" className="btn-brand mt-6"><Icon name="house-door" />Back to home</Link>
      </section>
    </>
  );
}
