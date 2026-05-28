// src/components/AboutSection.tsx
import React from 'react';
import './AboutSection.css';

const AboutSection: React.FC = () => {
  return (
    <div className="about-section">
      <h1 className="nexus-title">Acciones ElBosque</h1>
      <div className="description">
        <p>
          Acciones ElBosque is an intelligent investment platform that connects traders, brokers and global markets in a single ecosystem.
          We offer real-time analysis tools, institutional-level security and flexible plans to take control of your finances.
        </p>
        <p>
          Our goal is to democratize access to financial markets, providing transparency, low commissions and an intuitive experience for both beginners and professionals.
        </p>
      </div>
    </div>
  );
};

export default AboutSection;
