import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="container">
      <div className="card mt-5 mb-5" style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        lineHeight: '1.6',
        padding: 'var(--spacing-xl)',
      }}>
        <h1 style={{ 
          color: 'var(--color-primary)', 
          marginBottom: 'var(--spacing-lg)',
          textAlign: 'center'
        }}>
          Privacy Policy
        </h1>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Introduction</h2>
          <p>
            At CineStream, we respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
          </p>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
            <li className="mb-2"><strong>Personal Information:</strong> Name, email address, and password when you create an account.</li>
            <li className="mb-2"><strong>Profile Information:</strong> Age, gender, location, and streaming service preferences you choose to provide.</li>
            <li className="mb-2"><strong>Usage Data:</strong> Information about how you interact with our service, including movies viewed and ratings submitted.</li>
            <li className="mb-2"><strong>Device Information:</strong> IP address, browser type, and device identifiers.</li>
          </ul>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>How We Use Your Information</h2>
          <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
            <li className="mb-2">To provide and maintain our service</li>
            <li className="mb-2">To personalize your experience and provide movie recommendations</li>
            <li className="mb-2">To improve our website and user experience</li>
            <li className="mb-2">To communicate with you about service-related announcements</li>
            <li className="mb-2">To detect and prevent fraudulent activity</li>
          </ul>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. 
            However, no method of transmission over the Internet or electronic storage is 100% secure.
            While we strive to use commercially acceptable means to protect your personal data,
            we cannot guarantee its absolute security.
          </p>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>GDPR Compliance</h2>
          <p>
            For users in the European Economic Area (EEA), we ensure compliance with the General Data Protection Regulation (GDPR).
            This includes providing the following rights:
          </p>
          <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
            <li className="mb-2">The right to access your personal data</li>
            <li className="mb-2">The right to rectify inaccurate personal data</li>
            <li className="mb-2">The right to erasure ("right to be forgotten")</li>
            <li className="mb-2">The right to restrict processing of your personal data</li>
            <li className="mb-2">The right to data portability</li>
            <li className="mb-2">The right to object to processing of your personal data</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at privacy@cinestream.com.
          </p>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and
            hold certain information. Cookies are files with a small amount of data that may include
            an anonymous unique identifier. You can instruct your browser to refuse all cookies or to
            indicate when a cookie is being sent.
          </p>
        </section>
        
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last Updated" date below.
          </p>
          <p><strong>Last Updated:</strong> April 7, 2025</p>
        </section>
        
        <section>
          <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem' }}>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            privacy@cinestream.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
