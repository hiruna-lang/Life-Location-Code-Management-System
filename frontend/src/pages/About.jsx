import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './About.css'

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: .18 },
  transition: { duration: .45, ease: [0.22, 1, 0.36, 1] },
}

const audiences = [
  {
    number: '01',
    title: 'Citizens and communities',
    description: 'Find the official administrative areas and Life Location Codes connected to a home, village, or local service location.',
  },
  {
    number: '02',
    title: 'Government officers',
    description: 'Access a consistent national reference when processing records, delivering services, and coordinating across administrative levels.',
  },
  {
    number: '03',
    title: 'Divisional Secretariat officers',
    description: 'Review, correct, verify, and finalise GN division and village information within an assigned DS division.',
  },
  {
    number: '04',
    title: 'System administrators',
    description: 'Monitor verification progress, manage authorised users, generate reports, and review API access activity.',
  },
]

const benefits = [
  ['Accurate identification', 'Reduces ambiguity between locations with similar or duplicate names.'],
  ['One national hierarchy', 'Connects every record through Province, District, DS, GN Division, and Village.'],
  ['Faster public services', 'Helps users communicate the correct administrative location without lengthy explanations.'],
  ['Multilingual access', 'Supports English, Sinhala, and Tamil names for inclusive nationwide use.'],
  ['Verified information', 'Authorised officers can review records through a controlled draft and final verification process.'],
  ['Reusable data', 'Search results and analysis can be exported for official reporting and operational work.'],
]

const hierarchy = [
  ['01', 'Province', 'The highest provincial administrative level'],
  ['02', 'District', 'The district within the selected province'],
  ['03', 'Divisional Secretariat', 'The responsible divisional administration'],
  ['04', 'GN Division', 'The official Grama Niladhari administrative division'],
  ['05', 'Village', 'The local village record connected to the GN division'],
]

export default function About() {
  return (
    <div className="about-service-page">
      <motion.section
        className="about-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="about-hero__copy">
          <span className="about-eyebrow">National administrative location service</span>
          <h1>About the Life Location Code Service</h1>
          <p>
            A trusted digital directory for identifying, searching, and maintaining Sri Lanka’s
            official administrative locations through one clear national hierarchy.
          </p>
          <div className="about-hero__actions">
            <Link to="/" className="about-button about-button--primary">Search location codes</Link>
            <Link to="/same-gn" className="about-button about-button--secondary">View GN analysis</Link>
          </div>
        </div>
        <div className="about-hero__mark" aria-hidden="true">
          <span>LLC</span>
          <strong>One location.<br />One official code.</strong>
        </div>
      </motion.section>

      <motion.section className="about-purpose" {...reveal}>
        <div>
          <span className="about-section-number">01 — Purpose</span>
          <h2>Why this service exists</h2>
        </div>
        <div className="about-purpose__copy">
          <p>
            Sri Lankan place names can repeat across different administrative areas. The Life Location
            Code provides a structured reference that distinguishes each official location and connects
            it to its correct parent areas.
          </p>
          <p>
            The system brings public search, duplicate-name analysis, authorised verification, reporting,
            and API monitoring into one managed service for the Home Affairs Division.
          </p>
        </div>
      </motion.section>

      <motion.section className="about-hierarchy" {...reveal}>
        <div className="about-section-heading">
          <span className="about-section-number">02 — Location structure</span>
          <h2>From province to village</h2>
          <p>Every Life Location Code follows the official administrative path.</p>
        </div>
        <div className="about-hierarchy__flow">
          {hierarchy.map(([number, title, description]) => (
            <div key={title}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{description}</small>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section className="about-audience" {...reveal}>
        <div className="about-section-heading">
          <span className="about-section-number">03 — Intended users</span>
          <h2>Designed for public and official use</h2>
        </div>
        <div className="about-audience__grid">
          {audiences.map(item => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section className="about-benefits" {...reveal}>
        <div className="about-benefits__intro">
          <span className="about-section-number">04 — Benefits</span>
          <h2>Clearer information and better service delivery</h2>
          <p>A consistent location reference improves everyday searches and government operations.</p>
        </div>
        <div className="about-benefits__list">
          {benefits.map(([title, description], index) => (
            <div key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p><strong>{title}</strong><small>{description}</small></p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section className="about-access" {...reveal}>
        <div>
          <span className="about-section-number">05 — Access and responsibility</span>
          <h2>Public information with controlled maintenance</h2>
          <p>
            Anyone can search public location information without an account. Editing, verification,
            administration, and monitoring are restricted to authorised government personnel.
          </p>
        </div>
        <div className="about-access__actions">
          <Link to="/">Open public search <span>→</span></Link>
          <Link to="/login">Authorised officer login <span>→</span></Link>
        </div>
      </motion.section>
    </div>
  )
}
